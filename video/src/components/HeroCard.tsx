import React from "react";
import { theme } from "../theme";

export type Rarity = "SSR" | "UR";

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
            color: i < stars ? theme.star : "#d1d5db",
          }}
        >
          {"★"}
        </span>
      ))}
    </div>
  );
};

export const HeroCard: React.FC<Props> = ({
  name,
  stars,
  rarity,
  highlight = false,
  scale = 1,
}) => {
  const badgeColor = rarity === "UR" ? theme.ur : theme.ssr;
  return (
    <div
      style={{
        width: 260,
        padding: 24,
        background: theme.panel,
        border: `3px solid ${highlight ? theme.blue : theme.panelBorder}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        boxShadow: highlight
          ? "0 12px 30px rgba(37,99,235,0.25)"
          : "0 6px 16px rgba(0,0,0,0.08)",
        transform: `scale(${scale})`,
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        style={{
          alignSelf: "flex-end",
          background: badgeColor,
          color: "#fff",
          fontWeight: 800,
          fontSize: 20,
          padding: "4px 12px",
          borderRadius: 8,
          letterSpacing: 1,
        }}
      >
        {rarity}
      </div>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          background: `linear-gradient(135deg, ${badgeColor}, ${theme.blueDark})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 52,
          fontWeight: 800,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: theme.text }}>
        {name}
      </div>
      <StarRow stars={stars} />
    </div>
  );
};
