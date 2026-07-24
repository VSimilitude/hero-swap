// Maps each scene to its pre-baked narration clip.
//
// Narration is now generic (hero-name-free, only Sarah is named) and generated
// ONCE at build time — see video/scripts/generate-narration.mjs. There are a
// fixed handful of clips keyed by scene type (× normal/cane), reused wherever
// that scene type appears. This module turns a plan's scene list into the
// per-scene audio tracks the composition mounts, pulling file + exact duration
// from the generated manifest so scene-stretching still works.

import { Plan, Scene, SceneAudio, planScenes } from "./plan";
import { NARRATION_CLIPS } from "./narrationClips";

export type NarrationKey =
  | "intro"
  | "promote"
  | "pickup"
  | "swap_first"
  | "swap_later"
  | "pause"
  | "rebuild"
  | "finale";

// Which clip a given scene uses. The first swap gets the 2:1-conversion line;
// later swaps get the 1:1 line.
function sceneKey(scene: Scene): NarrationKey {
  switch (scene.kind) {
    case "intro":
      return "intro";
    case "promote":
      return "promote";
    case "pickup":
      return "pickup";
    case "swap":
      return scene.event.first ? "swap_first" : "swap_later";
    case "pause":
      return "pause";
    case "rebuild":
      return "rebuild";
    case "finale":
      return "finale";
  }
}

// One pre-baked narration track per scene, aligned with planScenes(plan). A
// missing clip (shouldn't happen) yields a silent entry so the scene still
// renders at its base length.
export function voiceoverFor(plan: Plan, caneMode: boolean): SceneAudio[] {
  const mode = caneMode ? "cane" : "normal";
  return planScenes(plan).map((scene) => {
    const clip = NARRATION_CLIPS[`${mode}_${sceneKey(scene)}`];
    return clip
      ? { url: clip.file, durationSeconds: clip.durationSeconds }
      : { url: "", durationSeconds: 0 };
  });
}
