# Animated Video Walkthrough — Implementation Plan (Remotion Player)

## Goal

Add an optional animated video walkthrough of the swap chain, rendered **live in
the browser** with `@remotion/player`, driven by the same user inputs as the
text guide. No MP4 rendering, no server: a one-time Node build step produces a
self-contained JS bundle that is checked into the repo, so the deployed site
stays fully static (PyScript + plain files, as today).

## Architecture

```
hero_swap_poc.py ──build_plan()──▶ plan JSON ──▶ window.HeroSwapVideo.mount(el, planJson)
      │                                                    ▲
      └─ generate_guide() renders text from the same plan  │
                                                           │
video/ (Remotion + React + esbuild) ──npm run build──▶ assets/swap-video.bundle.js
```

Three workstreams, in order:

1. **Plan-JSON refactor** in `hero_swap_poc.py` — single source of truth.
2. **Remotion project** in `video/` — compositions + embeddable Player bundle.
3. **Page wiring** — `index.html` checkbox + `main.py` passes the plan to the bundle.

---

## Step 1 — Plan builder (`hero_swap_poc.py`)

Add:

```python
def build_plan(
    swap_tokens: int,
    retiring_heroes: List[str] = None,
    top_ew_heroes: List[str] = None,
    pause_after_first: bool = False,
) -> dict
```

Returned shape (all keys always present):

```python
{
  "error": None,            # or "swap_tokens must be ..." — if set, other fields empty
  "swap_tokens": 2,
  "targets": ["Murphy", "Gordon"],
  "dropped": ["Kim"],       # named heroes that didn't fit the token budget
  "chain": ["Sarah", "Murphy", "Gordon"],
  "events": [
    {"type": "prep",       "hero": "Sarah"},
    {"type": "promote",    "hero": "Sarah"},
    {"type": "pickup"},
    {"type": "max_medals", "hero": "Murphy"},
    {"type": "swap", "carrier": "Sarah", "target": "Murphy",
     "first": True,  "conversion": "2:1"},
    {"type": "pause", "remaining": 1},          # only when pause_after_first
    {"type": "max_medals", "hero": "Gordon"},
    {"type": "swap", "carrier": "Murphy", "target": "Gordon",
     "first": False, "conversion": "1:1"},
    {"type": "rebuild",      "hero": "Gordon"},
    {"type": "apply_medals", "sources": ["Sarah", "Murphy", "Gordon"]},
  ],
}
```

Rules:

- **Case A (`swap_tokens == 0`)**: events are `prep`, `promote`, `pickup` only
  (the promotion-only sequence; `pickup` implies rebuilding Sarah — the video
  can caption this).
- **Tokens but no named heroes**: `targets == []`, `events == []` — callers
  treat this as "nothing to animate."
- **Invalid `swap_tokens`** (negative, non-int, bool): set `error`, empty
  everything else.
- Reuse the existing `build_targets()` for target/dropped computation.

Then refactor **both** `generate_guide()` and `_generate_guide_cane()` to
iterate over `build_plan()["events"]` instead of duplicating the chain-walking
logic. **The text output must remain byte-identical** — the assertions in
`_self_test()` pin exact wording and step numbering (e.g.
`"9. **Apply all remaining returned skill medals**"`). Run
`python3 hero_swap_poc.py --test` after the refactor; it must pass unchanged.
Extend `_self_test()` with assertions on `build_plan()` (event sequence for the
worked example, 0-token case, error case, pause event placement).

`main.py` note: `pause_after_first` affects the plan (pause event) but the
video should still animate the full chain — the pause becomes a "chapter card"
scene, not a truncation.

---

## Step 2 — Remotion project (`video/`)

New directory, standard layout:

```
video/
  package.json
  tsconfig.json
  src/
    plan.ts            # TypeScript types mirroring the plan JSON
    SwapChainVideo.tsx # root composition: <Series> of scenes from plan.events
    scenes/
      IntroScene.tsx   # chain overview: Sarah → … → final, arrows
      PromoteScene.tsx # Sarah SSR 5★ → UR 3★; medals+shards fly to mailbox
      PickupScene.tsx  # mailbox opens; "pick up BEFORE swapping" callout
      SwapScene.tsx    # two hero cards exchange star levels; shard packet
                       # slides carrier→target; on first=true show a
                       # "SSR → UR (2:1)" conversion badge; medals fly out
      PauseScene.tsx   # chapter card: "You can stop here — N swap(s) left"
      RebuildScene.tsx # final hero 3★ → 5★ using inherited UR shards
      FinaleScene.tsx  # medal shower onto silhouette heroes; "VS POINTS!"
    components/
      HeroCard.tsx     # name, star row (★ count), rarity badge (SSR/UR)
      Caption.tsx      # bottom caption bar, one line per scene
    embed.tsx          # bundle entry — see below
  remotion.config.ts   # optional, for `npm run studio`
```

### Composition details

- 1280×720, 30 fps. Scene durations (frames): intro 90, promote 105, pickup 75,
  max_medals folded INTO its swap scene (a brief "medals maxed ✓" beat at the
  start of SwapScene — do not give `max_medals` its own scene, pair each with
  the following swap event), swap 150, pause 75, rebuild 105, finale 90.
  Compute `durationInFrames` in JS from the plan; export a helper
  `planDuration(plan)` used by both the composition and the Player mount.
- Use `<Series>` / `<Sequence>`, `spring()` and `interpolate()` for motion.
  Keep it flat-design: no external images, no fonts beyond system sans-serif,
  no network requests (bundle must be fully self-contained).
- Visual language should match the site (`style.css`): white/neutral
  background, `#2563eb` / `#1e40af` blue accents, `#f8f9fa` panels. Stars gold
  (`#f59e0b`), UR badge purple, SSR badge orange, shard packet teal.
- Props: `{ plan: Plan, caneMode: boolean }`. `caneMode` only changes caption
  copy (short, loud, exclamatory — mirror the tone of `_generate_guide_cane`)
  and can bump the accent saturation; scene structure is identical.

### Embed entry (`src/embed.tsx`)

Expose a tiny global API (bundled as an IIFE):

```ts
window.HeroSwapVideo = {
  mount(el: HTMLElement, planJson: string, caneMode: boolean): void,
  unmount(el: HTMLElement): void,
}
```

- `mount` parses `planJson`, computes duration, and renders
  `<Player component={SwapChainVideo} inputProps={{plan, caneMode}}
  durationInFrames={...} compositionWidth={1280} compositionHeight={720}
  fps={30} controls style={{width: '100%'}} />` via `createRoot`.
- Keep a `WeakMap<HTMLElement, Root>` so repeat submits re-render cleanly
  (unmount previous root or just `root.render` again).
- If `plan.error` is set or `plan.events` is empty, render nothing (the Python
  side also guards this — belt and braces).

### Build

- `package.json`: pin `remotion` and `@remotion/player` to the **same exact
  version** (latest 4.x), `react`/`react-dom` 18.x, `esbuild`, `typescript`.
- Scripts:
  - `"build": "esbuild src/embed.tsx --bundle --minify --format=iife --outfile=../assets/swap-video.bundle.js --define:process.env.NODE_ENV='\"production\"'"`
  - `"typecheck": "tsc --noEmit"`
  - `"studio": "remotion studio"` (dev convenience; add a `Root.tsx` +
    `remotion.config.ts` registering the composition with sample plan props so
    the studio works — small file, worth it for iterating on animations).
- **Check `assets/swap-video.bundle.js` into git** — that's the point: deploy
  stays static. Add `video/node_modules/` to `.gitignore` (create one if
  missing).

---

## Step 3 — Page wiring

`index.html`:

- New checkbox row (after Cane-mode): `#show-video` — label
  "Show animated walkthrough", with an `input-hint` explaining it's a visual
  step-through of the same guide.
- After `#guide-output`'s container: `<div id="video-container" hidden></div>`.
- Load the bundle: `<script src="assets/swap-video.bundle.js" defer></script>`.
- Add minimal CSS: `#video-container { margin-top: 1rem; }` and let the Player
  fill width (aspect ratio comes from composition dimensions).

`main.py`:

- Import `build_plan`; on submit, if `#show-video` is checked and the plan has
  events and no error:
  ```python
  import json
  from pyscript import window
  plan = build_plan(swap_tokens, retiring, top_ew, pause_after_first=pause)
  window.HeroSwapVideo.mount(
      document.querySelector("#video-container"), json.dumps(plan), cane
  )
  document.querySelector("#video-container").hidden = False
  ```
- If unchecked (or plan empty/error): hide the container and call
  `window.HeroSwapVideo.unmount(...)` if the global exists.
- Guard for the bundle failing to load (`hasattr(window, "HeroSwapVideo")`) —
  degrade silently to text-only.

---

## Step 4 — Verification (all must pass)

1. `python3 hero_swap_poc.py --test` — refactor kept text output identical,
   new plan assertions pass.
2. `cd video && npm install && npm run typecheck && npm run build` — clean;
   `assets/swap-video.bundle.js` exists (expect roughly 300 KB–1.5 MB minified).
3. Smoke-test the bundle in a real browser: `python3 -m http.server` from the
   repo root, open the page, submit the default form with the video checkbox
   on, confirm the Player mounts and plays with no console errors. Use
   Playwright/headless Chromium if available (screenshot the mounted player at
   a mid-video frame); if no browser tooling is available, at minimum verify
   the bundle defines `HeroSwapVideo` by loading it in `node` with a DOM shim —
   and say so in the report.
4. Re-submit the form twice with different inputs — player re-mounts without
   duplicating.

## Docs

Add a short "Video walkthrough" section to `docs/implementation_plan.md` (or a
new `docs/video.md`): what the bundle is, how to rebuild it
(`cd video && npm install && npm run build`), and that the bundle is committed
on purpose.

## Out of scope (v1)

- MP4 export / Remotion Lambda.
- Game-art assets or hero portraits (flat cards with names only).
- Sound.
