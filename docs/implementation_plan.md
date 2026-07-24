# Implementation Plan

## Stack
- **PyScript** (Python running in-browser via Pyodide/WASM)
- Static HTML/CSS/JS hosted on **GitHub Pages**
- All logic in `main.py`

## User Inputs (v1)
1. **Hero swap tokens** — integer (0+)
2. **Retiring heroes** — natural-UR 5-star heroes the user is done using
   (optional, ordered by priority)
3. **Top EW heroes** — natural-UR 5-star heroes to backfill remaining swap
   slots, ordered highest EW first (optional)

Inputs 2 and 3 use a **roster typeahead with chips** (`chips.js`): as you type,
a dropdown filters the known hero roster (with mini portraits) and Enter/click
adds an ordered chip; free-text (off-roster) names still work as plain
letter-medallion chips. The roster is sourced once from `video/src/portraits.ts`
and exposed on `window.HeroSwapVideo.roster`; `main.py` reads the ordered chip
names (falling back to CSV parsing if the chip UI is unavailable). Sarah is
excluded (fixed chain start) and a hero already chipped in either field is not
re-suggested.

## Output
A numbered, step-by-step text guide customized to the user's inputs.

## Guide Generation Logic

Target list is built as: `dedupe(retiring_heroes + top_ew_heroes)[:swap_tokens]`.
See `docs/hero_swap_poc_spec.md` for full spec and worked examples.

### Case: 0 swap tokens
- Steps cover only Sarah's UR promotion and re-applying returned medals/shards.
- No swap occurs, so shards stay as SSR (lower value).
- Shards are used to rebuild Sarah to 5 stars.

### Case: 1+ swap tokens, with target heroes
- Full chain: promote Sarah → pick up medals + shards → for each target: max
  its medals, swap → rebuild final hero → apply all remaining medals.
- Shard conversion is SSR→UR 2:1 on swap #1 only; subsequent swaps are UR→UR 1:1.
- Shards ride with the 3-star hero ("hot potato") through the entire chain.
- The final hero in the chain ends at 3-star and is rebuilt using inherited shards.
- All heroes in the chain end at 5-star.
- Surplus named heroes beyond the token budget are reported to the user.

## File Structure
```
hero_swap/
├── index.html              # Page shell, loads PyScript + main.py + video bundle
├── style.css               # Styling
├── main.py                 # Web UI: input handling, display (PyScript)
├── chips.js                # Roster typeahead + chip pickers (vanilla JS)
├── hero_swap_poc.py        # Guide + plan generation logic (pure Python)
├── assets/
│   └── swap-video.bundle.js  # Committed Remotion Player bundle (built artifact)
├── video/                  # Remotion source for the walkthrough (build-time only)
└── docs/
    ├── game_mechanics.md
    ├── hero_swap_poc_spec.md
    └── implementation_plan.md
```

## Implementation Steps
1. Build the input form (PyScript DOM manipulation)
2. Write the guide-generation function (pure Python, returns list of step strings)
3. Wire form submission to guide generation and display
4. Style the output for readability
5. Test locally, then set up GitHub Pages deployment

## Video walkthrough

An optional animated walkthrough plays the swap chain in the browser using
`@remotion/player`. It is driven by the **same inputs** as the text guide:
`hero_swap_poc.build_plan()` produces a structured event list (the single source
of truth that `generate_guide()` also renders from), `main.py` serialises it with
`json.dumps`, and `window.HeroSwapVideo.mount(container, planJson, caneMode)`
renders the Player. Tick "Show animated walkthrough" on the form to enable it;
if the bundle is missing the page degrades silently to text-only.

- **Source:** `video/` — a Remotion 4.x + React 18 + TypeScript project. Scenes
  live in `video/src/scenes/`; `video/src/plan.ts` mirrors the Python plan shape.
- **Bundle:** `assets/swap-video.bundle.js` is a self-contained, minified IIFE
  built by esbuild. **It is committed on purpose** so the deployed site stays
  fully static (PyScript + plain files, no Node at runtime). No network requests,
  fonts, or images are loaded at page runtime.
- **Optional voiceover:** ticking the "Voiceover" checkbox narrates the
  walkthrough with an in-browser AI voice (Kokoro-82M via `kokoro-js`). The TTS
  runtime lives in a **second** committed bundle,
  `assets/swap-video-tts.bundle.js`, injected on demand only when voiceover is
  requested — the normal page load never touches it. It synthesizes one WAV per
  scene (`video/src/narration.ts`), mounts them as Remotion `<Audio>` tracks,
  and stretches any scene whose narration runs longer than its animation
  (`sceneFramesFor` in `plan.ts` feeds both the duration math and the layout).
  This is the one deliberate exception to the no-external-hosts rule: the voice
  model (~90 MB) and ONNX runtime are fetched from HuggingFace/CDN on first use,
  then cached by the browser. Device selection **probes for a real GPU adapter**
  (`navigator.gpu.requestAdapter()`) before committing to WebGPU — an
  adapter-less or flaky GPU stack goes straight to a clean WASM (q8) session
  rather than poisoning ONNX Runtime's shared JSEP module. A WebGPU synthesis
  failure additionally retries once on WASM; only if that also fails does the
  page drop to the silent walkthrough with a note. Both bundles are produced by
  `npm run build` (`build:player` + `build:tts`).
- **Rebuild after changing anything in `video/`:**
  ```
  cd video && npm install && npm run build
  ```
  This regenerates `assets/swap-video.bundle.js`; commit the updated bundle.
  `npm run typecheck` checks types; `npm run studio` opens the Remotion studio
  for iterating on animations. `video/node_modules/` is gitignored.

## Future Enhancements (not v1)
- More inputs (hero levels, medal counts, shard counts)
- Point total calculations
- Auto-ordering EW heroes by actual EW level
- Validating that named targets are in fact maxed natural-UR 5-star
- Hero database / dropdown selection
