import React, { useState } from "react";
import {
  theme,
  Rarity,
  rarityAccent,
  rarityGlow,
  darkOutline,
} from "../theme";
import { portraitFor } from "../portraits";
import { RarityWord } from "./RarityWord";

export type { Rarity };

type Props = {
  name: string;
  stars: number; // 0..5
  rarity: Rarity;
  highlight?: boolean;
  scale?: number;
};

const StarRow: React.FC<{ stars: number }> = ({ stars }) => {
  const total = 5;
  return (
    <div style={{ display: "flex", gap: 4, height: 34 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 30,
            lineHeight: "34px",
            color: i < stars ? theme.star : "rgba(255,255,255,0.22)",
            textShadow: i < stars ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
          }}
        >
          {"★"}
        </span>
      ))}
    </div>
  );
};

// Portrait if we have real art for this hero, else a flat letter medallion.
// The <img> falls back to the letter medallion if the file fails to load (e.g.
// inside `remotion studio`, which serves from video/ not the repo root).
export const HeroAvatar: React.FC<{
  name: string;
  ringColor: string;
  size?: number;
}> = ({ name, ringColor, size = 120 }) => {
  const url = portraitFor(name);
  const [failed, setFailed] = useState(false);

  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    flex: "none" as const,
  };

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          ...ring,
          objectFit: "cover",
          border: `3px solid ${ringColor}`,
          background: theme.panelSolid,
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...ring,
        background: `linear-gradient(135deg, ${ringColor}, ${theme.panelSolid})`,
        border: `3px solid ${ringColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.43,
        fontWeight: 900,
        textShadow: darkOutline(2),
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

// A game-style hero card: dark translucent panel framed and glowing in the
// hero's rarity colour (gold for UR, pink for SSR), rarity wordmark badge,
// portrait, name, star row.
export const HeroCard: React.FC<Props> = ({
  name,
  stars,
  rarity,
  highlight = false,
  scale = 1,
}) => {
  const accent = rarityAccent(rarity);
  return (
    <div
      style={{
        width: 264,
        padding: "18px 24px 24px",
        background: theme.panel,
        border: `3px solid ${accent}`,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        boxShadow: `${rarityGlow(rarity)}, 0 10px 26px rgba(0,0,0,0.45)${
          highlight ? ", 0 0 0 4px rgba(126,216,247,0.55)" : ""
        }`,
        transform: `scale(${scale})`,
        fontFamily: theme.fontFamily,
      }}
    >
      <div style={{ alignSelf: "flex-end" }}>
        <RarityWord rarity={rarity} size={30} />
      </div>
      <HeroAvatar name={name} ringColor={accent} />
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: theme.text,
          textShadow: darkOutline(2),
        }}
      >
        {name}
      </div>
      <StarRow stars={stars} />
    </div>
  );
};
