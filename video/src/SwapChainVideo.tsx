import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { VideoProps, planScenes } from "./plan";
import { theme } from "./theme";
import { IntroScene } from "./scenes/IntroScene";
import { PromoteScene } from "./scenes/PromoteScene";
import { PickupScene } from "./scenes/PickupScene";
import { SwapScene } from "./scenes/SwapScene";
import { PauseScene } from "./scenes/PauseScene";
import { RebuildScene } from "./scenes/RebuildScene";
import { FinaleScene } from "./scenes/FinaleScene";

export const SwapChainVideo: React.FC<VideoProps> = ({ plan, caneMode }) => {
  const scenes = planScenes(plan);

  if (scenes.length === 0) {
    return <AbsoluteFill style={{ background: theme.bg }} />;
  }

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Series>
        {scenes.map((scene, i) => {
          let node: React.ReactNode = null;
          switch (scene.kind) {
            case "intro":
              node = <IntroScene chain={plan.chain} caneMode={caneMode} />;
              break;
            case "promote":
              node = (
                <PromoteScene hero={scene.event.hero} caneMode={caneMode} />
              );
              break;
            case "pickup":
              node = <PickupScene caneMode={caneMode} />;
              break;
            case "swap":
              node = (
                <SwapScene
                  event={scene.event}
                  maxHero={scene.maxHero}
                  caneMode={caneMode}
                />
              );
              break;
            case "pause":
              node = (
                <PauseScene
                  remaining={scene.event.remaining}
                  caneMode={caneMode}
                />
              );
              break;
            case "rebuild":
              node = (
                <RebuildScene hero={scene.event.hero} caneMode={caneMode} />
              );
              break;
            case "finale":
              node = (
                <FinaleScene
                  sources={scene.event.sources}
                  caneMode={caneMode}
                />
              );
              break;
          }
          return (
            <Series.Sequence
              key={i}
              durationInFrames={scene.durationInFrames}
            >
              {node}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
