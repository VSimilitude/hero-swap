import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Player } from "@remotion/player";
import { SwapChainVideo } from "./SwapChainVideo";
import { FPS, WIDTH, HEIGHT, Plan, planDuration } from "./plan";

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

function mount(el: HTMLElement, planJson: string, caneMode: boolean): void {
  if (!el) return;
  const plan = parsePlan(planJson);

  // Nothing to animate: clear the host and bail (Python guards this too).
  if (!plan || plan.error || !plan.events || plan.events.length === 0) {
    unmount(el);
    return;
  }

  const durationInFrames = planDuration(plan);

  getRoot(el).render(
    <Player
      component={SwapChainVideo}
      inputProps={{ plan, caneMode: Boolean(caneMode) }}
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
      mount: (el: HTMLElement, planJson: string, caneMode: boolean) => void;
      unmount: (el: HTMLElement) => void;
    };
  }
}

window.HeroSwapVideo = { mount, unmount };
