# Voiceover — Implementation Plan (Kokoro in-browser)

## Goal

Opt-in narrated voiceover for the video walkthrough, synthesized **in the
browser** with Kokoro-82M via the `kokoro-js` npm package (ONNX build running
on transformers.js; WebGPU when available, WASM fallback). Per-scene WAVs are
generated up front and mounted as real `<Audio>` tracks inside the Remotion
composition — frame-synced and scrub-safe. Works for any hero name.

This is an explicit exception to the "no external hosts" rule, gated behind a
checkbox: the voice model (~40–90 MB depending on quantization) and ONNX
runtime WASM are fetched from HuggingFace/CDN on first use and cached by the
browser. The core text-guide and silent-video paths remain fully static.

## Architecture

```
main.py ── plan JSON + voiceover flag ──▶ embed bundle
                                             │ (voiceover checked)
                              lazy-load assets/swap-video-tts.bundle.js
                                             │
                              narrationFor(plan, caneMode) → one line per scene
                                             │
                              kokoro-js synthesize → per-scene WAV blob URLs
                                             │
                    <Player> with voiceover prop → <Audio> in each scene <Sequence>
```

## Steps

### 1. Narration script (`video/src/narration.ts`)

`narrationFor(plan, caneMode)` returns one short spoken line per scene, in
scene order (mirroring `planScenes`). Lines are conversational versions of the
captions — e.g. promote: "Promote Sarah to U R. She drops to three stars, and
all her medals and shards go back to the mailbox." Spell "UR" as "U R" and
"SSR" as "S S R" so the TTS pronounces them as letters. Cane-mode gets the
loud phrasing ("BOOM! Sarah is U R now!"). Keep every line comfortably
speakable in ≲ its scene's duration at normal rate; the duration-extension
step below is the safety net, not the plan.

### 2. TTS bundle (`video/src/tts-entry.ts` → `assets/swap-video-tts.bundle.js`)

- Separate esbuild entry so the main player bundle stays lean; the page loads
  it only when the voiceover checkbox is ticked (inject `<script>` on demand).
- Add `kokoro-js` to package.json. Entry exposes
  `window.HeroSwapTTS.synthesize(lines, opts)`:
  - `KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",
    {dtype: "q8", device: navigator.gpu ? "webgpu" : "wasm"})`
  - Progress callback (model download %, then per-line synthesis progress)
    surfaced to a status element in the page.
  - Voice: pick a clear default (e.g. `af_heart`); a different, more
    energetic voice for cane-mode is a nice touch if trivial.
  - Each line → WAV blob → `URL.createObjectURL`; return
    `[{url, durationSeconds}]` (duration from the raw audio length /
    sampling rate).
  - Errors (no network, unsupported browser) reject cleanly; page falls back
    to mounting the silent video with a visible note.

### 3. Composition audio support

- `SwapChainVideo` accepts optional `voiceover?: {url, durationSeconds}[]`
  aligned with the scene list. Each scene `<Sequence>` renders
  `<Audio src={...}/>` when its entry exists.
- **Scene stretching:** if a line's audio (plus ~15-frame tail) exceeds its
  scene's frames, extend that scene to fit. Duration math must stay
  consistent: compute effective per-scene frames once (`sceneFramesFor(plan,
  voiceover)`) and use it for both `planDuration` and the `<Series>` layout.
  Silent scenes keep their current lengths.

### 4. Page wiring

- `index.html`: "Voiceover" checkbox row after "Show animated walkthrough"
  with an input-hint noting the one-time ~90 MB model download; a status line
  for progress ("Loading voice model… 43%", "Generating narration… 3/9").
- `main.py`: when both video + voiceover are checked, call the JS glue that
  loads the TTS bundle, synthesizes, then mounts the player with the
  voiceover prop. Voiceover unchecked → exactly today's behavior. Synthesis
  failure → mount silent video + show the fallback note.
- The "Generate Guide" click is the user gesture that authorizes audio
  playback; don't auto-play the player.

### 5. Verification

- `npm run typecheck && npm run build` (now emits both bundles).
- `python3 hero_swap_poc.py --test` unchanged.
- Browser test (Playwright headless chromium — WASM path, so keep it small):
  use the 0-token promotion-only guide (3 scenes) with voiceover checked;
  confirm model loads, progress UI updates, per-scene `<Audio>` elements
  exist with blob URLs, scene durations extended where audio is longer,
  player total duration matches, zero console errors. Screenshot the progress
  UI and the mounted player. Also verify the voiceover-unchecked path is
  byte-identical in behavior (no TTS bundle request).

## Out of scope

- Committing model weights to the repo.
- Word-level caption highlighting.
- Web Speech API fallback (may add later).
