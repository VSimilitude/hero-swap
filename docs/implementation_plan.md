# Implementation Plan

## Stack
- **PyScript** (Python running in-browser via Pyodide/WASM)
- Static HTML/CSS/JS hosted on **GitHub Pages**
- All logic in `main.py`

## User Inputs (v1)
1. **Hero swap tokens** — integer (0+)
2. **Retiring heroes** — comma-separated list of natural-UR 5-star heroes the
   user is done using (optional, ordered)
3. **Top EW heroes** — comma-separated list of natural-UR 5-star heroes to
   backfill remaining swap slots, ordered highest EW first (optional)

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
