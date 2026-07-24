// Standalone bundle: in-browser Kokoro text-to-speech for the walkthrough.
//
// This is emitted as assets/swap-video-tts.bundle.js and is loaded ONLY when
// the user ticks the Voiceover checkbox — never on normal page load. It pulls
// in kokoro-js + @huggingface/transformers (ONNX runtime), which fetch the
// voice model (~40-90 MB) and WASM/WebGPU runtime from HuggingFace/CDN on first
// use. That network access is the deliberate, opt-in exception to the app's
// otherwise fully-static, no-external-hosts design.

import { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

// Voices (see kokoro-js model card). af_heart is the clear default; cane-mode
// gets af_bella — a more energetic, expressive read for the loud phrasing.
type Voice = NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"];
const VOICE_DEFAULT: Voice = "af_heart";
const VOICE_CANE: Voice = "af_bella";

type TTSProgress =
  // Voice model / runtime download.
  | { phase: "model"; percent: number; file: string }
  // Per-line synthesis.
  | { phase: "synth"; index: number; total: number };

type SynthOptions = {
  caneMode?: boolean;
  onProgress?: (p: TTSProgress) => void;
};

type SceneAudio = { url: string; durationSeconds: number };

// transformers.js progress-callback payload (subset we care about).
type HFProgress = {
  status: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type Device = "webgpu" | "wasm";

function makeProgressCallback(
  onProgress?: (p: TTSProgress) => void,
): (data: HFProgress) => void {
  return (data: HFProgress) => {
    if (!onProgress) return;
    if (data.status === "progress" && typeof data.progress === "number") {
      onProgress({
        phase: "model",
        percent: Math.max(0, Math.min(100, Math.round(data.progress))),
        file: data.file || data.name || "",
      });
    }
  };
}

// Pick the execution device. Crucially we *probe an actual GPU adapter* before
// committing to WebGPU: some environments expose navigator.gpu but can't hand
// out an adapter (headless Chromium, flaky/blocklisted GPU stacks). Attempting
// the WebGPU EP there poisons ONNX Runtime's shared JSEP WASM module, so a
// later WASM retry in the same page also fails. Probing up front means an
// adapter-less stack goes straight to a clean WASM session and still gets audio.
async function pickDevice(): Promise<Device> {
  const gpu =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<unknown> } }).gpu
      : undefined;
  if (gpu && typeof gpu.requestAdapter === "function") {
    try {
      const adapter = await gpu.requestAdapter();
      if (adapter) return "webgpu";
    } catch {
      // fall through to wasm
    }
  }
  return "wasm";
}

// One cached model-load promise per device, reused across calls (cane +
// non-cane share it). Keyed by device so a WASM retry after a WebGPU failure
// loads a fresh session instead of reusing the poisoned one.
const modelByDevice = new Map<Device, Promise<KokoroTTS>>();

function loadModel(
  device: Device,
  onProgress?: (p: TTSProgress) => void,
): Promise<KokoroTTS> {
  const cached = modelByDevice.get(device);
  if (cached) return cached;
  const dtype = device === "webgpu" ? "fp32" : "q8"; // fp32 for GPU, q8 for WASM
  const p = KokoroTTS.from_pretrained(MODEL_ID, {
    dtype,
    device,
    progress_callback: makeProgressCallback(onProgress),
  }).catch((err) => {
    // Don't cache a failed load — let a later attempt retry from scratch.
    modelByDevice.delete(device);
    throw err;
  });
  modelByDevice.set(device, p);
  return p;
}

// Load the model on `device` and synthesize one WAV per line, in order.
async function synthesizeWith(
  device: Device,
  lines: string[],
  voice: Voice,
  onProgress?: (p: TTSProgress) => void,
): Promise<SceneAudio[]> {
  const tts = await loadModel(device, onProgress);
  const out: SceneAudio[] = [];
  for (let i = 0; i < lines.length; i++) {
    onProgress?.({ phase: "synth", index: i, total: lines.length });
    const text = (lines[i] || "").trim();
    if (!text) {
      out.push({ url: "", durationSeconds: 0 });
      continue;
    }
    const audio = await tts.generate(text, { voice });
    const url = URL.createObjectURL(audio.toBlob());
    const durationSeconds = audio.audio.length / audio.sampling_rate;
    out.push({ url, durationSeconds });
  }
  onProgress?.({ phase: "synth", index: lines.length, total: lines.length });
  return out;
}

// Synthesize one WAV per line, in order. Returns blob-URL + duration per line,
// aligned 1:1 with the input array. Fallback chain: try the preferred device
// (WebGPU when a real adapter exists) → on any failure, retry once forcing WASM
// (q8) → if that also fails, reject cleanly so the page can drop to the silent
// video.
async function synthesize(
  lines: string[],
  opts: SynthOptions = {},
): Promise<SceneAudio[]> {
  const { caneMode = false, onProgress } = opts;
  const voice = caneMode ? VOICE_CANE : VOICE_DEFAULT;

  const device = await pickDevice();
  try {
    return await synthesizeWith(device, lines, voice, onProgress);
  } catch (err) {
    if (device === "webgpu") {
      // eslint-disable-next-line no-console
      console.warn("[HeroSwapTTS] WebGPU synthesis failed, retrying with WASM:", err);
      modelByDevice.delete("webgpu");
      return await synthesizeWith("wasm", lines, voice, onProgress);
    }
    throw err;
  }
}

declare global {
  interface Window {
    HeroSwapTTS: {
      synthesize: (lines: string[], opts?: SynthOptions) => Promise<SceneAudio[]>;
    };
  }
}

window.HeroSwapTTS = { synthesize };
