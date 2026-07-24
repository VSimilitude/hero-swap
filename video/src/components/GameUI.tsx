import React from "react";
import { theme, darkOutline } from "../theme";

// White bold heading with the game's dark outline.
export const Heading: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
}> = ({ children, size = 44, color = theme.text }) => (
  <div
    style={{
      fontFamily: theme.fontFamily,
      fontWeight: 900,
      fontSize: size,
      color,
      textShadow: darkOutline(Math.max(2, Math.round(size * 0.05))),
      letterSpacing: 0.5,
    }}
  >
    {children}
  </div>
);

// Glossy cyan-blue "Promote"/"Go"-style button with white outlined text.
export const GameButton: React.FC<{
  label: string;
  pressed?: boolean;
  glow?: number;
  width?: number;
}> = ({ label, pressed = false, glow = 0, width = 260 }) => (
  <div
    style={{
      width,
      padding: "14px 0",
      textAlign: "center",
      borderRadius: 14,
      background: `linear-gradient(180deg, ${theme.cyanLight} 0%, ${theme.cyan} 55%, ${theme.cyanDark} 100%)`,
      border: "2px solid rgba(255,255,255,0.7)",
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.6), 0 6px 14px rgba(0,0,0,0.4), 0 0 ${glow}px rgba(126,216,247,${glow ? 0.8 : 0})`,
      transform: `scale(${pressed ? 0.94 : 1})`,
      color: "#fff",
      fontFamily: theme.fontFamily,
      fontWeight: 900,
      fontSize: 26,
      textShadow: darkOutline(2),
      letterSpacing: 1,
    }}
  >
    {label}
  </div>
);

// A fan of gold stars (as over the game's MAX'd skill icons).
export const StarFan: React.FC<{ count?: number; size?: number }> = ({
  count = 5,
  size = 16,
}) => (
  <div style={{ display: "flex", gap: 1 }}>
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: size,
          lineHeight: 1,
          color: theme.star,
          transform: `translateY(${Math.abs(i - (count - 1) / 2) * 2}px)`,
          textShadow: "0 1px 1px rgba(0,0,0,0.6)",
        }}
      >
        {"★"}
      </span>
    ))}
  </div>
);

// Small "MAX" badge like the game's maxed skill icons.
export const MaxBadge: React.FC = () => (
  <div
    style={{
      background: "#151530",
      border: "1px solid rgba(255,255,255,0.35)",
      color: "#fff",
      fontFamily: theme.fontFamily,
      fontWeight: 900,
      fontSize: 12,
      padding: "2px 8px",
      borderRadius: 6,
      letterSpacing: 1,
      textShadow: "0 1px 1px rgba(0,0,0,0.7)",
    }}
  >
    MAX
  </div>
);
