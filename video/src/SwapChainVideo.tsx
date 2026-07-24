import React from "react";
import { AbsoluteFill, Audio, Series } from "remotion";
import { VideoProps, planScenes, sceneFramesFor } from "./plan";
import { theme } from "./theme";
import { IntroScene } from "./scenes/IntroScene";
import { PromoteScene } from "./scenes/PromoteScene";
import { PickupScene } from "./scenes/PickupScene";
import { SwapScene } from "./scenes/SwapScene";
import { PauseScene } from "./scenes/PauseScene";
import { RebuildScene } from "./scenes/RebuildScene";
import { FinaleScene } from "./scenes/FinaleScene";

export const SwapChainVideo: React.FC<VideoProps> = ({
  plan,
  caneMode,
  voiceover,
}) => {
  const scenes = planScenes(plan);
  // Effective per-scene lengths (stretched to fit narration when present).
  const frames = sceneFramesFor(plan, voiceover);

  if (scenes.length === 0) {
    return <AbsoluteFill style={{ background: theme.bgBottom }} />;
  }

  return (
    <AbsoluteFill style={{ background: theme.bgBottom }}>
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
          const audio = voiceover && voiceover[i];
          return (
            <Series.Sequence key={i} durationInFrames={frames[i]}>
              {node}
              {audio ? <Audio src={audio.url} /> : null}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
