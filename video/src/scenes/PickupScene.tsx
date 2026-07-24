import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { theme } from "../theme";

type Props = {
  caneMode: boolean;
};

// Mailbox opens; "pick up BEFORE swapping" callout.
export const PickupScene: React.FC<Props> = ({ caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const open = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const lidAngle = interpolate(open, [0, 1], [0, -110]);

  const caption = caneMode
    ? "OPEN MAILBOX, GRAB EVERYTHING! DON'T SWAP YET!"
    : "Pick up the returned medals + shards BEFORE any swap.";

  return (
    <Stage>
      <div style={{ position: "relative", width: 360, height: 320 }}>
        {/* Box body */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 120,
            width: 240,
            height: 160,
            background: theme.blueDark,
            borderRadius: 12,
          }}
        />
        {/* Lid */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 120,
            width: 240,
            height: 44,
            background: theme.blue,
            borderRadius: "12px 12px 0 0",
            transformOrigin: "top center",
            transform: `rotateX(${lidAngle}deg)`,
          }}
        />
        {/* Tokens popping out */}
        {Array.from({ length: 5 }).map((_, i) => {
          const start = 24 + i * 4;
          const p = interpolate(frame, [start, start + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isShard = i % 2 === 0;
          const targetX = 90 + i * 40;
          const x = interpolate(p, [0, 1], [180, targetX]);
          const y = interpolate(p, [0, 0.5, 1], [150, 40, 90]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 34,
                height: 34,
                borderRadius: isShard ? 7 : 17,
                background: isShard ? theme.shard : theme.medal,
                opacity: p,
                transform: `scale(${0.6 + p * 0.6})`,
              }}
            />
          );
        })}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
