import React from "react";
import { theme, Rarity, rarityGradient } from "../theme";

// The game's UR / SSR wordmark: bold italic, rarity gradient fill, dark
// outline. Two stacked layers — a dark stroked layer behind, a gradient-clipped
// layer in front — because background-clip:text can't also carry a text-shadow.
export const RarityWord: React.FC<{
  rarity: Rarity;
  size?: number;
}> = ({ rarity, size = 34 }) => {
  const common: React.CSSProperties = {
    fontFamily: theme.fontFamily,
    fontWeight: 900,
    fontStyle: "italic",
    fontSize: size,
    lineHeight: 1,
    letterSpacing: 1,
    userSelect: "none",
  };
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        height: size,
      }}
    >
      {/* outline layer */}
      <span
        style={{
          ...common,
          color: theme.outline,
          WebkitTextStroke: `${Math.max(3, size * 0.12)}px ${theme.outline}`,
        }}
      >
        {rarity}
      </span>
      {/* gradient fill layer */}
      <span
        style={{
          ...common,
          position: "absolute",
          left: 0,
          top: 0,
          background: rarityGradient(rarity),
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        {rarity}
      </span>
    </span>
  );
};
