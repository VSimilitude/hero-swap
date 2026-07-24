import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

// Common scene backdrop: white page, content centred above the caption bar.
export const Stage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        fontFamily: theme.fontFamily,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 120,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
