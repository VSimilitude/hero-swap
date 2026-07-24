import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroCard } from "../components/HeroCard";
import { ShardIcon } from "../components/ItemIcons";

type Props = {
  hero: string;
  caneMode: boolean;
};

// Final hero 3★ → 5★ using inherited UR shards.
export const RebuildScene: React.FC<Props> = ({ hero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grow = spring({
    frame: frame - 44,
    fps,
    config: { damping: 200 },
    durationInFrames: 80,
  });
  const stars = Math.round(interpolate(grow, [0, 1], [3, 5]));

  const caption = caneMode
    ? `BUILD ${hero} BACK TO 5 STARS!`
    : `Rebuild ${hero} to 5★ with the inherited UR shards.`;

  return (
    <Stage>
      <div style={{ position: "relative", width: 520, height: 400 }}>
        <div style={{ position: "absolute", left: 128, top: 40 }}>
          <HeroCard name={hero} stars={stars} rarity="UR" highlight />
        </div>
        {/* shards spiralling in and consumed into the hero */}
        {Array.from({ length: 8 }).map((_, i) => {
          const start = 10 + i * 7;
          const p = interpolate(frame, [start, start + 50], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const angle = (i / 8) * Math.PI * 2;
          const x = interpolate(p, [0, 1], [260 + Math.cos(angle) * 230, 260]);
          const y = interpolate(p, [0, 1], [190 + Math.sin(angle) * 160, 190]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                opacity: p < 1 ? 1 - p * 0.25 : 0,
                transform: `scale(${1.1 - p * 0.5})`,
              }}
            >
              <ShardIcon rarity="UR" size={30} />
            </div>
          );
        })}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
