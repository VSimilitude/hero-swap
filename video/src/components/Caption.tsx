import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, accent } from "../theme";

type Props = {
  text: string;
  caneMode: boolean;
};

// Bottom caption bar — one line per scene. Fades/rises in.
export const Caption: React.FC<Props> = ({ text, caneMode }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 12], [24, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 40,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          textAlign: "center",
          background: accent(caneMode),
          color: "#fff",
          fontFamily: theme.fontFamily,
          fontSize: caneMode ? 34 : 30,
          fontWeight: caneMode ? 800 : 600,
          lineHeight: 1.3,
          padding: "18px 32px",
          borderRadius: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          textTransform: caneMode ? "uppercase" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};
