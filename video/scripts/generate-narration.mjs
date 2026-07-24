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

// Voice per mode. af_heart = clear default narrator; af_bella = more energetic
// read for cane-mode's loud phrasing.
const VOICES = { normal: "af_heart", cane: "af_bella" };

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
  cane: {
    intro: "Hero swap time! Let's promote Sarah and grab all the points!",
    promote: "Promote Sarah to U R! Boom! She's three stars now!",
    pickup: "Open the mailbox and grab everything! Don't lose those shards!",
    swap_first:
      "First swap! Sarah trades with the next hero! Whooosh! S S R turns into U R!",
    swap_later: "Swap again! Pass the shards down the line! Whooosh!",
    pause: "Pause! You can stop right here and save the rest for later!",
    rebuild: "Build the last hero back up to five stars!",
    finale:
      "Put all the leftover medals on your favorites! Points, points, points!",
  },
};

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

async function main() {
  const ffmpeg = hasFfmpeg();
  // Probe lamejs availability once so we can report the chosen encoder.
  const lameOk =
    !ffmpeg && (await encodeMp3Lame(new Float32Array(1152), 24000)) !== null;
  const encoder = ffmpeg ? "ffmpeg -> mp3" : lameOk ? "lamejs -> mp3" : "16-bit PCM WAV";
  console.log(`Encoder: ${encoder}`);

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Loading ${MODEL_ID} (q8 / cpu)…`);
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: "q8",
    device: "cpu",
  });

  const clips = {};
  let totalBytes = 0;
  let totalSeconds = 0;

  for (const mode of Object.keys(LINES)) {
    const voice = VOICES[mode];
    for (const [key, text] of Object.entries(LINES[mode])) {
      const clipKey = `${mode}_${key}`;
      const audio = await tts.generate(text, { voice });
      const rate = audio.sampling_rate;
      const durationSeconds =
        Math.round((audio.audio.length / rate) * 1000) / 1000;

      let outFile;
      if (ffmpeg) {
        const wavPath = path.join(OUT_DIR, `${clipKey}.wav`);
        await writeFile(wavPath, encodeWav16(audio.audio, rate));
        const mp3Path = path.join(OUT_DIR, `${clipKey}.mp3`);
        execFileSync(
          "ffmpeg",
          ["-y", "-i", wavPath, "-ac", "1", "-b:a", "48k", mp3Path],
          { stdio: "ignore" },
        );
        await rm(wavPath);
        outFile = `${clipKey}.mp3`;
      } else if (lameOk) {
        const mp3 = await encodeMp3Lame(audio.audio, rate);
        await writeFile(path.join(OUT_DIR, `${clipKey}.mp3`), mp3);
        outFile = `${clipKey}.mp3`;
      } else {
        await writeFile(
          path.join(OUT_DIR, `${clipKey}.wav`),
          encodeWav16(audio.audio, rate),
        );
        outFile = `${clipKey}.wav`;
      }

      const { size } = await import("node:fs").then((fs) =>
        fs.promises.stat(path.join(OUT_DIR, outFile)),
      );
      totalBytes += size;
      totalSeconds += durationSeconds;

      clips[clipKey] = {
        file: `${REL_PREFIX}/${outFile}`,
        durationSeconds,
      };
      console.log(
        `  ${clipKey.padEnd(16)} ${durationSeconds.toFixed(2)}s  ${(size / 1024).toFixed(0)} KB  (${voice})`,
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
