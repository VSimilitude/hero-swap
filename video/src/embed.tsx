import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Player } from "@remotion/player";
import { SwapChainVideo } from "./SwapChainVideo";
import { FPS, WIDTH, HEIGHT, Plan, SceneAudio, planDuration } from "./plan";
import { narrationFor } from "./narration";
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

function mount(
  el: HTMLElement,
  planJson: string,
  caneMode: boolean,
  voiceover?: SceneAudio[] | null,
): void {
  if (!el) return;
  const plan = parsePlan(planJson);

  // Nothing to animate: clear the host and bail (Python guards this too).
  if (!plan || plan.error || !plan.events || plan.events.length === 0) {
    unmount(el);
    return;
  }

  const vo = Array.isArray(voiceover) && voiceover.length ? voiceover : null;
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

// --- Voiceover orchestration -------------------------------------------------
// The TTS runtime lives in a separate, heavy bundle (kokoro-js + ONNX). It is
// injected on demand the first time the user asks for voiceover, so the normal
// page load never touches it.

let ttsBundlePromise: Promise<void> | null = null;

function loadTtsBundle(): Promise<void> {
  if (window.HeroSwapTTS) return Promise.resolve();
  if (ttsBundlePromise) return ttsBundlePromise;
  ttsBundlePromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "assets/swap-video-tts.bundle.js";
    s.async = true;
    s.onload = () =>
      window.HeroSwapTTS
        ? resolve()
        : reject(new Error("TTS bundle loaded but HeroSwapTTS is missing"));
    s.onerror = () => {
      ttsBundlePromise = null;
      reject(new Error("Failed to load the TTS bundle"));
    };
    document.head.appendChild(s);
  });
  return ttsBundlePromise;
}

function setStatus(statusEl: HTMLElement | null, text: string): void {
  if (statusEl) statusEl.textContent = text;
}

// Full path for the voiceover-checked case: lazy-load the TTS bundle, generate
// per-scene narration, synthesize it, then mount the player with the audio.
// Any failure degrades gracefully to the silent walkthrough with a visible note.
async function mountWithVoiceover(
  el: HTMLElement,
  planJson: string,
  caneMode: boolean,
  statusEl?: HTMLElement | null,
): Promise<void> {
  if (!el) return;
  const status = statusEl ?? null;
  const plan = parsePlan(planJson);
  if (!plan || plan.error || !plan.events || plan.events.length === 0) {
    unmount(el);
    return;
  }

  try {
    setStatus(status, "Loading voice model… (one-time ~90 MB download)");
    await loadTtsBundle();
    const lines = narrationFor(plan, Boolean(caneMode));
    const voiceover = await window.HeroSwapTTS.synthesize(lines, {
      caneMode: Boolean(caneMode),
      onProgress: (p) => {
        if (p.phase === "model") {
          setStatus(status, `Loading voice model… ${p.percent}%`);
        } else {
          const done = Math.min(p.index + 1, p.total);
          setStatus(status, `Generating narration… ${done}/${p.total}`);
        }
      },
    });
    setStatus(status, "");
    // Debug/observability hook: the most recently synthesized track list, so
    // the walkthrough's audio can be inspected from the console or tests.
    (window as unknown as { __heroSwapVoiceover?: SceneAudio[] }).__heroSwapVoiceover =
      voiceover;
    mount(el, planJson, caneMode, voiceover);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[HeroSwapVideo] voiceover failed, using silent video:", err);
    setStatus(
      status,
      "Voiceover unavailable — playing the silent walkthrough instead.",
    );
    mount(el, planJson, caneMode, null);
  }
}

declare global {
  interface Window {
    HeroSwapVideo: {
      mount: (
        el: HTMLElement,
        planJson: string,
        caneMode: boolean,
        voiceover?: SceneAudio[] | null,
      ) => void;
      mountWithVoiceover: (
        el: HTMLElement,
        planJson: string,
        caneMode: boolean,
        statusEl?: HTMLElement | null,
      ) => Promise<void>;
      unmount: (el: HTMLElement) => void;
      // Shared hero roster for the page's typeahead chip pickers (Sarah
      // excluded). resolveSlug maps typed text/aliases to a roster slug;
      // portraitUrl builds the mini-portrait path.
      roster: RosterHero[];
      resolveSlug: (name: string) => string | null;
      portraitUrl: (slug: string) => string;
    };
    HeroSwapTTS: {
      synthesize: (
        lines: string[],
        opts?: {
          caneMode?: boolean;
          onProgress?: (
            p:
              | { phase: "model"; percent: number; file: string }
              | { phase: "synth"; index: number; total: number },
          ) => void;
        },
      ) => Promise<SceneAudio[]>;
    };
  }
}

window.HeroSwapVideo = {
  mount,
  mountWithVoiceover,
  unmount,
  roster: ROSTER,
  resolveSlug,
  portraitUrl,
};
