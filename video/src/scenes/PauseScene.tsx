import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption";
import { theme, accent } from "../theme";

type Props = {
  remaining: number;
  caneMode: boolean;
};

// Chapter card: "You can stop here — N swap(s) left".
export const PauseScene: React.FC<Props> = ({ remaining, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], {
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
    <AbsoluteFill
      style={{
        background: accent(caneMode),
        fontFamily: theme.fontFamily,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 100,
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
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: 2 }}>
          {"⏸ "}
          {heading}
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, marginTop: 20 }}>
          {sub}
        </div>
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </AbsoluteFill>
  );
};
