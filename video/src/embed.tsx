import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Player } from "@remotion/player";
import { SwapChainVideo } from "./SwapChainVideo";
import { FPS, WIDTH, HEIGHT, Plan, SceneAudio, planDuration } from "./plan";
import { voiceoverFor } from "./narration";
import { ROSTER, RosterHero, resolveSlug, portraitUrl } from "./portraits";

// One React root per host element, so repeat submits re-render cleanly.
const roots = new WeakMap<HTMLElement, Root>();

function parsePlan(planJson: string): Plan | null {
  try {
    const plan = JSON.parse(planJson) as Plan;
    if (!plan || typeof plan !== "object") return null;
    return plan;
  } catch {
    return null;
  }
}

function getRoot(el: HTMLElement): Root {
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  return root;
}

// Mount the walkthrough. When `voiceover` is true, the pre-baked narration
// clips (generic, hero-name-free, generated at build time) are attached as
// per-scene <Audio> tracks — same-origin static files, no network, no TTS.
function mount(
  el: HTMLElement,
  planJson: string,
  caneMode: boolean,
  voiceover?: boolean,
): void {
  if (!el) return;
  const plan = parsePlan(planJson);

  // Nothing to animate: clear the host and bail (Python guards this too).
  if (!plan || plan.error || !plan.events || plan.events.length === 0) {
    unmount(el);
    return;
  }

  const vo: SceneAudio[] | null = voiceover
    ? voiceoverFor(plan, Boolean(caneMode))
    : null;
  // Debug/observability hook: the mounted track list, inspectable from the
  // console or tests.
  (window as unknown as { __heroSwapVoiceover?: SceneAudio[] | null }).__heroSwapVoiceover =
    vo;

  const durationInFrames = planDuration(plan, vo);

  getRoot(el).render(
    <Player
      component={SwapChainVideo}
      inputProps={{ plan, caneMode: Boolean(caneMode), voiceover: vo }}
      durationInFrames={durationInFrames}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      fps={FPS}
      controls
      style={{ width: "100%" }}
    />,
  );
}

function unmount(el: HTMLElement): void {
  if (!el) return;
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
  // Belt and braces in case React left anything behind.
  el.innerHTML = "";
}

declare global {
  interface Window {
    HeroSwapVideo: {
      mount: (
        el: HTMLElement,
        planJson: string,
        caneMode: boolean,
        voiceover?: boolean,
      ) => void;
      unmount: (el: HTMLElement) => void;
      // Shared hero roster for the page's typeahead chip pickers (Sarah
      // excluded). resolveSlug maps typed text/aliases to a roster slug;
      // portraitUrl builds the mini-portrait path.
      roster: RosterHero[];
      resolveSlug: (name: string) => string | null;
      portraitUrl: (slug: string) => string;
    };
  }
}

window.HeroSwapVideo = {
  mount,
  unmount,
  roster: ROSTER,
  resolveSlug,
  portraitUrl,
};
