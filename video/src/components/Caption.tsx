import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, darkOutline } from "../theme";

type Props = {
  text: string;
  caneMode: boolean;
};

// Bottom caption bar — the game's translucent dark rounded panel. Fades/rises
// in slowly so there is time to read it.
export const Caption: React.FC<Props> = ({ text, caneMode }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [28, 0], {
    extrapolateRight: "clamp",
  });
  const border = caneMode ? theme.urGold : "rgba(126,216,247,0.55)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 44,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          textAlign: "center",
          background: "rgba(12, 14, 34, 0.82)",
          border: `2px solid ${border}`,
          color: "#fff",
          fontFamily: theme.fontFamily,
          fontSize: caneMode ? 34 : 30,
          fontWeight: caneMode ? 900 : 600,
          lineHeight: 1.34,
          padding: "18px 34px",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          textShadow: darkOutline(1),
          textTransform: caneMode ? "uppercase" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};
