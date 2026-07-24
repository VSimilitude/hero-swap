import React from "react";
import { Composition } from "remotion";
import { SwapChainVideo } from "./SwapChainVideo";
import { FPS, WIDTH, HEIGHT, Plan, planDuration } from "./plan";

// Sample plan mirroring hero_swap_poc.build_plan(2, ["Murphy"], ["Gordon"]).
const SAMPLE_PLAN: Plan = {
  error: null,
  swap_tokens: 2,
  targets: ["Murphy", "Gordon"],
  dropped: [],
  chain: ["Sarah", "Murphy", "Gordon"],
  events: [
    { type: "prep", hero: "Sarah" },
    { type: "promote", hero: "Sarah" },
    { type: "pickup" },
    { type: "max_medals", hero: "Murphy" },
    {
      type: "swap",
      carrier: "Sarah",
      target: "Murphy",
      first: true,
      conversion: "2:1",
    },
    { type: "max_medals", hero: "Gordon" },
    {
      type: "swap",
      carrier: "Murphy",
      target: "Gordon",
      first: false,
      conversion: "1:1",
    },
    { type: "rebuild", hero: "Gordon" },
    { type: "apply_medals", sources: ["Sarah", "Murphy", "Gordon"] },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SwapChain"
        component={SwapChainVideo}
        durationInFrames={planDuration(SAMPLE_PLAN)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ plan: SAMPLE_PLAN, caneMode: false }}
      />
      <Composition
        id="SwapChainCane"
        component={SwapChainVideo}
        durationInFrames={planDuration(SAMPLE_PLAN)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ plan: SAMPLE_PLAN, caneMode: true }}
      />
    </>
  );
};
