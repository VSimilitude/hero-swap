import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { Heading } from "../components/GameUI";
import { MedalIcon, ShardIcon, ItemTile } from "../components/ItemIcons";
import { theme } from "../theme";

type Props = {
  caneMode: boolean;
};

// Mailbox opens; returned items land as authentic inventory tiles.
export const PickupScene: React.FC<Props> = ({ caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const open = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const lidAngle = interpolate(open, [0, 1], [0, -110]);

  const tilesIn = spring({
    frame: frame - 58,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });

  const caption = caneMode
    ? "OPEN MAILBOX, GRAB EVERYTHING! DON'T SWAP YET!"
    : "Pick up the returned medals + shards BEFORE any swap.";

  return (
    <Stage>
      <div style={{ marginBottom: 26, textAlign: "center" }}>
        <Heading size={38}>Mailbox</Heading>
      </div>
      <div style={{ position: "relative", width: 300, height: 210 }}>
        {/* Box body */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 60,
            width: 220,
            height: 140,
            background: `linear-gradient(180deg, ${theme.cyan}, ${theme.cyanDark})`,
            border: "3px solid rgba(255,255,255,0.35)",
            borderRadius: 14,
            boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
          }}
        />
        {/* Lid */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 60,
            width: 220,
            height: 44,
            background: `linear-gradient(180deg, ${theme.cyanLight}, ${theme.cyan})`,
            border: "3px solid rgba(255,255,255,0.45)",
            borderRadius: "14px 14px 0 0",
            transformOrigin: "top center",
            transform: `rotateX(${lidAngle}deg)`,
          }}
        />
        {/* items popping out */}
        {Array.from({ length: 6 }).map((_, i) => {
          const start = 30 + i * 6;
          const p = interpolate(frame, [start, start + 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isShard = i % 2 === 0;
          const targetX = 44 + i * 36;
          const x = interpolate(p, [0, 1], [150, targetX]);
          const y = interpolate(p, [0, 0.5, 1], [90, -30, 20]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                opacity: p,
                transform: `scale(${0.5 + p * 0.5})`,
              }}
            >
              {isShard ? <ShardIcon rarity="SSR" size={30} /> : <MedalIcon size={28} />}
            </div>
          );
        })}
      </div>

      {/* returned inventory tiles */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 18,
          opacity: tilesIn,
          transform: `translateY(${interpolate(tilesIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <ItemTile count="x40" label="Skill Medals" size={116}>
          <MedalIcon size={78} />
        </ItemTile>
        <ItemTile count="x800" label="SSR Shards" size={116}>
          <ShardIcon rarity="SSR" size={84} />
        </ItemTile>
      </div>

      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
