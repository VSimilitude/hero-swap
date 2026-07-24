import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroCard } from "../components/HeroCard";
import { theme } from "../theme";

type Props = {
  hero: string;
  caneMode: boolean;
};

// Final hero 3★ → 5★ using inherited UR shards.
export const RebuildScene: React.FC<Props> = ({ hero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grow = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200 },
    durationInFrames: 55,
  });
  const stars = Math.round(interpolate(grow, [0, 1], [3, 5]));

  const caption = caneMode
    ? `BUILD ${hero} BACK TO 5 STARS!`
    : `Rebuild ${hero} to 5★ with the inherited UR shards.`;

  return (
    <Stage>
      <div style={{ position: "relative", width: 500, height: 400 }}>
        <div style={{ position: "absolute", left: 120, top: 40 }}>
          <HeroCard name={hero} stars={stars} rarity="UR" highlight />
        </div>
        {/* shards consumed into the hero */}
        {Array.from({ length: 5 }).map((_, i) => {
          const start = 6 + i * 4;
          const p = interpolate(frame, [start, start + 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const angle = (i / 5) * Math.PI * 2;
          const x = interpolate(p, [0, 1], [250 + Math.cos(angle) * 200, 250]);
          const y = interpolate(p, [0, 1], [180 + Math.sin(angle) * 140, 180]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 26,
                height: 26,
                borderRadius: 6,
                background: theme.shard,
                opacity: p < 1 ? 1 - p * 0.3 : 0,
              }}
            />
          );
        })}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
