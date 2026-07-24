// TypeScript mirror of the plan produced by hero_swap_poc.build_plan().
// Keep in sync with that Python function — it is the single source of truth.

export type PrepEvent = { type: "prep"; hero: string };
export type PromoteEvent = { type: "promote"; hero: string };
export type PickupEvent = { type: "pickup" };
export type MaxMedalsEvent = { type: "max_medals"; hero: string };
export type SwapEvent = {
  type: "swap";
  carrier: string;
  target: string;
  first: boolean;
  conversion: string; // "2:1" | "1:1"
};
export type PauseEvent = { type: "pause"; remaining: number };
export type RebuildEvent = { type: "rebuild"; hero: string };
export type ApplyMedalsEvent = { type: "apply_medals"; sources: string[] };

export type PlanEvent =
  | PrepEvent
  | PromoteEvent
  | PickupEvent
  | MaxMedalsEvent
  | SwapEvent
  | PauseEvent
  | RebuildEvent
  | ApplyMedalsEvent;

export type Plan = {
  error: string | null;
  swap_tokens: number | null;
  targets: string[];
  dropped: string[];
  chain: string[];
  events: PlanEvent[];
};

// One synthesized narration track per scene, aligned with planScenes().
export type SceneAudio = { url: string; durationSeconds: number };

export type VideoProps = {
  plan: Plan;
  caneMode: boolean;
  voiceover?: SceneAudio[] | null;
};

// Frames of silent tail left after a narration line finishes, so scenes that
// are stretched to fit their audio don't cut to the next scene the instant the
// voice stops.
export const AUDIO_TAIL_FRAMES = 15;

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

// Per-scene durations in frames. max_medals has no scene of its own — it is
// folded into the following swap scene as a short opening beat.
// Per-scene durations in frames (30 fps). Paced slow (~1.6x the original
// budgets) so captions are readable and the star exchanges are legible.
export const SCENE_FRAMES = {
  intro: 150,
  promote: 180,
  pickup: 120,
  swap: 240,
  pause: 120,
  rebuild: 170,
  finale: 150,
} as const;

// A "scene" here is a top-level <Series.Sequence>. max_medals events are
// dropped (folded into their swap); the trailing rebuild + apply_medals events
// collapse into a single finale scene. Intro is synthetic (always first when
// there is anything to show).
export type Scene =
  | { kind: "intro"; durationInFrames: number }
  | { kind: "promote"; event: PromoteEvent; durationInFrames: number }
  | { kind: "pickup"; event: PickupEvent; durationInFrames: number }
  | {
      kind: "swap";
      event: SwapEvent;
      maxHero: string | null;
      durationInFrames: number;
    }
  | { kind: "pause"; event: PauseEvent; durationInFrames: number }
  | { kind: "rebuild"; event: RebuildEvent; durationInFrames: number }
  | {
      kind: "finale";
      event: ApplyMedalsEvent;
      durationInFrames: number;
    };

// Turn the flat event list into the scene list the composition renders.
export function planScenes(plan: Plan): Scene[] {
  const scenes: Scene[] = [];
  if (plan.error || plan.events.length === 0) {
    return scenes;
  }

  scenes.push({ kind: "intro", durationInFrames: SCENE_FRAMES.intro });

  let pendingMax: string | null = null;
  for (const ev of plan.events) {
    switch (ev.type) {
      case "prep":
        // Prep is covered by the intro overview; no standalone scene.
        break;
      case "promote":
        scenes.push({
          kind: "promote",
          event: ev,
          durationInFrames: SCENE_FRAMES.promote,
        });
        break;
      case "pickup":
        scenes.push({
          kind: "pickup",
          event: ev,
          durationInFrames: SCENE_FRAMES.pickup,
        });
        break;
      case "max_medals":
        pendingMax = ev.hero;
        break;
      case "swap":
        scenes.push({
          kind: "swap",
          event: ev,
          maxHero: pendingMax,
          durationInFrames: SCENE_FRAMES.swap,
        });
        pendingMax = null;
        break;
      case "pause":
        scenes.push({
          kind: "pause",
          event: ev,
          durationInFrames: SCENE_FRAMES.pause,
        });
        break;
      case "rebuild":
        scenes.push({
          kind: "rebuild",
          event: ev,
          durationInFrames: SCENE_FRAMES.rebuild,
        });
        break;
      case "apply_medals":
        scenes.push({
          kind: "finale",
          event: ev,
          durationInFrames: SCENE_FRAMES.finale,
        });
        break;
    }
  }

  return scenes;
}

// Effective per-scene frame counts. Without voiceover this is just each
// scene's built-in duration. With voiceover, any scene whose narration (plus a
// short silent tail) runs longer than its built-in duration is stretched to
// fit; silent/shorter scenes keep their current length. This single function
// feeds BOTH planDuration() and the <Series> layout so the two never drift.
export function sceneFramesFor(
  plan: Plan,
  voiceover?: SceneAudio[] | null,
): number[] {
  const scenes = planScenes(plan);
  return scenes.map((scene, i) => {
    const base = scene.durationInFrames;
    const vo = voiceover && voiceover[i];
    if (!vo || !(vo.durationSeconds > 0)) return base;
    const needed = Math.ceil(vo.durationSeconds * FPS) + AUDIO_TAIL_FRAMES;
    return Math.max(base, needed);
  });
}

export function planDuration(plan: Plan, voiceover?: SceneAudio[] | null): number {
  const total = sceneFramesFor(plan, voiceover).reduce((sum, f) => sum + f, 0);
  // Player requires durationInFrames >= 1 even when there is nothing to show.
  return Math.max(1, total);
}
