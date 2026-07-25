// Build-time narration generator.
//
//   npm run narration   (from the video/ directory)
//
// Synthesizes the fixed, hero-name-free narration lines to audio ONCE, at build
// time, using kokoro-js in Node (q8 / CPU). Output is a small set of static
// clips under assets/narration/ plus a generated manifest module
// (src/narrationClips.ts) mapping each clip key to its file + exact duration.
//
// The runtime no longer does any in-browser TTS: the voiceover checkbox simply
// mounts these same-origin static clips as <Audio> tracks. Re-run this whenever
// the narration text changes and commit the updated audio + manifest.
//
// Clips are encoded to small mono MP3s (~a few hundred KB total): via ffmpeg if
// it's on PATH, otherwise via the pure-JS lamejs encoder (a devDependency).
// If neither is available they fall back to 16-bit PCM WAVs (a couple of MB) —
// all fine, since the files are static and cached.

import { KokoroTTS } from "kokoro-js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

// Voice + speed per mode.
//   normal → af_heart: clear, warm narrator at natural pace.
//   cane   → am_santa: jolly, deep, theatrical — picked by ear from the
//            `--audition` set (over am_puck @1.1 and af_bella @1.15) despite
//            its lower model-card grade; the roughness suits the silly read.
const MODES = {
  normal: { voice: "af_heart", speed: 1.0 },
  cane: { voice: "am_santa", speed: 1.0 },
};

// One line per scene type. Hero-name-free — only Sarah (the fixed chain start)
// is named; every other hero is "the next hero" / "the last hero", since the
// visuals already show who's who. Rarities are spelled out so the model says
// them as letters.
const LINES = {
  normal: {
    intro:
      "Here's the plan. We promote Sarah to U R, then use everything she returns to score V S points.",
    promote:
      "First, promote Sarah to U R. She drops to three stars, and all her skill medals and shards return to your mailbox.",
    pickup:
      "Now open your mailbox and pick everything up — the returned skill medals and the S S R shards.",
    swap_first:
      "For the first swap, Sarah trades places with the next hero. Sarah rises to five stars, while the next hero drops to three and inherits the shards, converting S S R to U R at two to one.",
    swap_later:
      "Swap again with the next hero. The three-star carrier rises to five stars, and the next hero drops to three, carrying the shards onward at one to one.",
    pause:
      "You can stop here. Sarah is now U R and five stars. Save your remaining swaps for a future week, then continue when you're ready.",
    rebuild:
      "Now rebuild the last hero in the chain back to five stars using the inherited U R shards.",
    finale:
      "Finally, apply every returned skill medal to your favorite heroes for maximum V S points.",
  },
  // Cane-mode: loud, theatrical, silly — short and snappy, lots of exclamations
  // and dramatic pauses. Keep the "U R" / "S S R" spellings.
  cane: {
    intro: "HERO SWAP TIME! Are you READY?! Let's promote Sarah and grab ALL the points!",
    promote: "PROMOTE Sarah to U R! KA-BOOM!! She's three stars now — WHOA!",
    pickup: "Open that mailbox and GRAB everything! Don't you DARE lose those shards!",
    swap_first:
      "FIRST SWAP! Sarah trades places — WHOOSH!! S S R turns into U R! MAGIC!",
    swap_later: "SWAP again! Send those shards zooming down the line — WHOOSH!!",
    pause: "PAUSE!! Stop RIGHT here and save the rest for later. Sneaky, sneaky!",
    rebuild: "Build that last hero back up to FIVE STARS! POW, POW, POW!",
    finale: "Dump ALL the leftover medals on your favorites! POINTS! POINTS! POINTS!!",
  },
};

// Candidate voice/speed combos rendered by `--audition <dir>` for the
// cane_swap_first line, so a human can pick the cane-mode voice by ear.
const AUDITIONS = [
  { voice: "am_santa", speed: 1.0 },
  { voice: "am_puck", speed: 1.1 },
  { voice: "af_bella", speed: 1.15 },
];

const HERE = import.meta.dirname;
const OUT_DIR = path.resolve(HERE, "../../assets/narration");
const MANIFEST = path.resolve(HERE, "../src/narrationClips.ts");
const REL_PREFIX = "assets/narration";

function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Float32 [-1,1] -> Int16Array.
function toInt16(samples) {
  const n = samples.length;
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

// Encode Float32 mono audio to a mono MP3 Buffer via lamejs. Returns null if
// lamejs isn't available.
async function encodeMp3Lame(samples, rate, kbps = 48) {
  let lame;
  try {
    const mod = await import("@breezystack/lamejs");
    lame = mod.default || mod;
  } catch {
    return null;
  }
  const enc = new lame.Mp3Encoder(1, rate, kbps);
  const int16 = toInt16(samples);
  const chunks = [];
  const block = 1152;
  for (let i = 0; i < int16.length; i += block) {
    const buf = enc.encodeBuffer(int16.subarray(i, i + block));
    if (buf.length > 0) chunks.push(Buffer.from(buf));
  }
  const end = enc.flush();
  if (end.length > 0) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

// Float32 [-1,1] -> 16-bit PCM mono WAV Buffer.
function encodeWav16(samples, rate) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    buf.writeInt16LE(s | 0, o);
    o += 2;
  }
  return buf;
}

// Encode a Float32 mono buffer to <dir>/<base>.<ext> (mp3 via ffmpeg/lamejs, or
// WAV fallback). Returns { outFile, size }.
async function encodeClip(samples, rate, dir, base, encMode) {
  if (encMode === "ffmpeg") {
    const wavPath = path.join(dir, `${base}.wav`);
    await writeFile(wavPath, encodeWav16(samples, rate));
    const mp3Path = path.join(dir, `${base}.mp3`);
    execFileSync("ffmpeg", ["-y", "-i", wavPath, "-ac", "1", "-b:a", "48k", mp3Path], {
      stdio: "ignore",
    });
    await rm(wavPath);
  } else if (encMode === "lamejs") {
    await writeFile(path.join(dir, `${base}.mp3`), await encodeMp3Lame(samples, rate));
  } else {
    await writeFile(path.join(dir, `${base}.wav`), encodeWav16(samples, rate));
  }
  const outFile = `${base}.${encMode === "wav" ? "wav" : "mp3"}`;
  const { size } = await import("node:fs").then((fs) =>
    fs.promises.stat(path.join(dir, outFile)),
  );
  return { outFile, size };
}

async function detectEncoder() {
  const ffmpeg = hasFfmpeg();
  const lameOk =
    !ffmpeg && (await encodeMp3Lame(new Float32Array(1152), 24000)) !== null;
  return ffmpeg ? "ffmpeg" : lameOk ? "lamejs" : "wav";
}

async function loadTts() {
  console.log(`Loading ${MODEL_ID} (q8 / cpu)…`);
  return KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "cpu" });
}

// `--audition <dir>`: render the cane_swap_first line in each candidate
// voice/speed combo to <dir>/audition_<voice>.mp3 (never touches assets/).
async function runAudition(outDir) {
  const encMode = await detectEncoder();
  console.log(`Audition mode — encoder: ${encMode}`);
  await mkdir(outDir, { recursive: true });
  const tts = await loadTts();
  const text = LINES.cane.swap_first;
  console.log(`Line: ${JSON.stringify(text)}\n`);
  for (const { voice, speed } of AUDITIONS) {
    const audio = await tts.generate(text, { voice, speed });
    const dur = audio.audio.length / audio.sampling_rate;
    const { outFile, size } = await encodeClip(
      audio.audio,
      audio.sampling_rate,
      outDir,
      `audition_${voice}`,
      encMode,
    );
    console.log(
      `  ${voice.padEnd(10)} @${speed}  ${dur.toFixed(2)}s  ${(size / 1024).toFixed(0)} KB  -> ${path.join(outDir, outFile)}`,
    );
  }
}

async function main() {
  const auditionFlag = process.argv.indexOf("--audition");
  if (auditionFlag !== -1) {
    const dir = process.argv[auditionFlag + 1];
    if (!dir) {
      console.error("Usage: node generate-narration.mjs --audition <outDir>");
      process.exit(2);
    }
    return runAudition(path.resolve(dir));
  }

  const encMode = await detectEncoder();
  console.log(`Encoder: ${encMode === "wav" ? "16-bit PCM WAV" : `${encMode} -> mp3`}`);

  await mkdir(OUT_DIR, { recursive: true });
  const tts = await loadTts();

  const clips = {};
  let totalBytes = 0;
  let totalSeconds = 0;

  for (const mode of Object.keys(LINES)) {
    const { voice, speed } = MODES[mode];
    for (const [key, text] of Object.entries(LINES[mode])) {
      const clipKey = `${mode}_${key}`;
      const audio = await tts.generate(text, { voice, speed });
      const rate = audio.sampling_rate;
      const durationSeconds =
        Math.round((audio.audio.length / rate) * 1000) / 1000;

      const { outFile, size } = await encodeClip(
        audio.audio,
        rate,
        OUT_DIR,
        clipKey,
        encMode,
      );
      totalBytes += size;
      totalSeconds += durationSeconds;

      clips[clipKey] = { file: `${REL_PREFIX}/${outFile}`, durationSeconds };
      console.log(
        `  ${clipKey.padEnd(16)} ${durationSeconds.toFixed(2)}s  ${(size / 1024).toFixed(0)} KB  (${voice} @${speed})`,
      );
    }
  }

  // Emit the generated manifest module.
  const entries = Object.keys(clips)
    .sort()
    .map(
      (k) =>
        `  ${JSON.stringify(k)}: { file: ${JSON.stringify(clips[k].file)}, durationSeconds: ${clips[k].durationSeconds} },`,
    )
    .join("\n");

  const manifest = `// GENERATED FILE — do not edit by hand.
// Produced by video/scripts/generate-narration.mjs (npm run narration).
// Maps each narration clip key to its pre-baked, same-origin audio file and its
// exact duration (used for scene-stretching in the composition).

export type NarrationClip = { file: string; durationSeconds: number };

export const NARRATION_CLIPS: Record<string, NarrationClip> = {
${entries}
};
`;
  await writeFile(MANIFEST, manifest);

  console.log(
    `\nWrote ${Object.keys(clips).length} clips (${(totalBytes / 1024).toFixed(0)} KB total, ${totalSeconds.toFixed(1)}s audio) to ${OUT_DIR}`,
  );
  console.log(`Manifest: ${MANIFEST}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
