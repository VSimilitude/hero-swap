import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption";
import { theme, darkOutline } from "../theme";

type Props = {
  remaining: number;
  caneMode: boolean;
};

// Chapter card: "You can stop here — N swap(s) left".
export const PauseScene: React.FC<Props> = ({ remaining, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });

  const heading = caneMode ? "PAUSE!" : "You can stop here";
  const sub = caneMode
    ? "SAVE THE REST FOR LATER!"
    : `Save the remaining ${remaining} swap${remaining > 1 ? "s" : ""} for a future week.`;
  const caption = caneMode
    ? "STOP HERE AND SAVE THE REST!"
    : "Optional checkpoint — the chain resumes below.";

  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 50% at 50% 44%, rgba(255,180,58,0.22) 0%, rgba(58,58,104,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#fff",
            opacity,
            transform: `scale(${0.85 + pop * 0.15})`,
          }}
        >
          <div
            style={{
              fontSize: 70,
              fontWeight: 900,
              letterSpacing: 2,
              color: caneMode ? theme.urGold : "#ffffff",
              textShadow: darkOutline(3),
            }}
          >
            {"⏸ "}
            {heading}
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              marginTop: 22,
              color: theme.star,
              textShadow: darkOutline(2),
            }}
          >
            {sub}
          </div>
        </div>
      </AbsoluteFill>
      <Caption text={caption} caneMode={caneMode} />
    </AbsoluteFill>
  );
};
