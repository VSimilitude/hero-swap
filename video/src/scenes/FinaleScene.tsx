import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { theme, accent } from "../theme";

type Props = {
  sources: string[];
  caneMode: boolean;
};

// Medal shower onto silhouette heroes; "VS POINTS!".
export const FinaleScene: React.FC<Props> = ({ sources, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titlePop = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  const caption = caneMode
    ? "PUT ALL LEFTOVER MEDALS ON YOUR FAVORITES! POINTS!"
    : `Apply every returned medal (from ${sources.join(", ")}) for VS points.`;

  return (
    <Stage>
      {/* raining medals */}
      {Array.from({ length: 24 }).map((_, i) => {
        const col = (i * 53) % 1200;
        const delay = (i * 7) % 40;
        const p = interpolate(frame, [delay, delay + 60], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(p, [0, 1], [-40, 640]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: col + 40,
              top: y,
              width: 26,
              height: 26,
              borderRadius: 13,
              background: theme.medal,
              opacity: 0.9,
            }}
          />
        );
      })}

      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: accent(caneMode),
          transform: `scale(${0.7 + titlePop * 0.3})`,
          textShadow: "0 4px 16px rgba(0,0,0,0.12)",
          zIndex: 2,
        }}
      >
        VS POINTS!
      </div>

      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
