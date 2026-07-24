import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

// Common scene backdrop: the game's dark navy-indigo gradient with a soft
// radial glow behind the action. Content sits above the caption bar.
export const Stage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily }}>
      {/* base vertical gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`,
        }}
      />
      {/* centre glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at 50% 42%, ${theme.bgGlow} 0%, rgba(58,58,104,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 130,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
