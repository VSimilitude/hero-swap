import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { Heading } from "../components/GameUI";
import { theme, darkOutline } from "../theme";

type Props = {
  caneMode: boolean;
};

// Mailbox opens; "pick up BEFORE swapping" callout.
export const PickupScene: React.FC<Props> = ({ caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const open = spring({ frame: frame - 24, fps, config: { damping: 200 } });
  const lidAngle = interpolate(open, [0, 1], [0, -110]);

  const caption = caneMode
    ? "OPEN MAILBOX, GRAB EVERYTHING! DON'T SWAP YET!"
    : "Pick up the returned medals + shards BEFORE any swap.";

  return (
    <Stage>
      <div style={{ marginBottom: 34, textAlign: "center" }}>
        <Heading size={38}>Mailbox</Heading>
      </div>
      <div style={{ position: "relative", width: 360, height: 300 }}>
        {/* Box body */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 120,
            width: 240,
            height: 160,
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
            left: 60,
            top: 120,
            width: 240,
            height: 46,
            background: `linear-gradient(180deg, ${theme.cyanLight}, ${theme.cyan})`,
            border: "3px solid rgba(255,255,255,0.45)",
            borderRadius: "14px 14px 0 0",
            transformOrigin: "top center",
            transform: `rotateX(${lidAngle}deg)`,
          }}
        />
        {/* Tokens popping out */}
        {Array.from({ length: 6 }).map((_, i) => {
          const start = 40 + i * 7;
          const p = interpolate(frame, [start, start + 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isShard = i % 2 === 0;
          const targetX = 74 + i * 36;
          const x = interpolate(p, [0, 1], [180, targetX]);
          const y = interpolate(p, [0, 0.5, 1], [150, 20, 84]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 34,
                height: 34,
                borderRadius: isShard ? 8 : 17,
                background: isShard ? theme.shard : theme.medal,
                border: "2px solid rgba(255,255,255,0.55)",
                boxShadow: `0 0 12px ${isShard ? theme.shard : theme.medal}`,
                opacity: p,
                transform: `scale(${0.6 + p * 0.6})`,
              }}
            />
          );
        })}
      </div>
      <div style={{ height: 12 }} />
      <div
        style={{
          color: theme.star,
          fontSize: 20,
          fontWeight: 900,
          textShadow: darkOutline(1),
        }}
      >
        medals + shards returned
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
