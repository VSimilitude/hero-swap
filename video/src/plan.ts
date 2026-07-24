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

export type VideoProps = {
  plan: Plan;
  caneMode: boolean;
};

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

// Per-scene durations in frames. max_medals has no scene of its own — it is
// folded into the following swap scene as a short opening beat.
export const SCENE_FRAMES = {
  intro: 90,
  promote: 105,
  pickup: 75,
  swap: 150,
  pause: 75,
  rebuild: 105,
  finale: 90,
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

export function planDuration(plan: Plan): number {
  const total = planScenes(plan).reduce(
    (sum, s) => sum + s.durationInFrames,
    0,
  );
  // Player requires durationInFrames >= 1 even when there is nothing to show.
  return Math.max(1, total);
}
