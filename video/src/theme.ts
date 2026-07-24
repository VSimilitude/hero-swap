// Visual language modelled on Last War's in-game UI (Hero Promotion screen).
// Dark navy-indigo backdrop, gold-gradient UR / pink-gradient SSR wordmarks,
// white outlined headings, glossy cyan buttons, orange reward banner.
// No external assets — system sans-serif bold/italic only.

export const theme = {
  // Scene backdrop (deep indigo, matches the promotion screen).
  bgTop: "#2a2a4e",
  bgBottom: "#15152b",
  bgGlow: "#3a3a68",
  topBar: "#3c3c5e",

  // Panels / cards (dark translucent over the navy).
  panel: "rgba(12, 14, 34, 0.62)",
  panelSolid: "#20223f",
  panelBorder: "rgba(255, 255, 255, 0.14)",

  // Text.
  text: "#ffffff",
  textMuted: "#b6b8d6",
  textGreen: "#8ce68a",

  // Rarity accents (game-standard: UR = gold, SSR = pink).
  urGold: "#ffb43a",
  urGoldLight: "#ffee99",
  ssrPink: "#e56bff",
  ssrPinkLight: "#fac2ff",

  // Misc accents.
  star: "#ffcf3a",
  shard: "#28c7c7", // shard packet teal-cyan
  medal: "#ffcf3a",
  cyan: "#46b0ec",
  cyanLight: "#7fd8f7",
  cyanDark: "#2f93df",
  bannerOrange: "#ff8f3a",

  outline: "#160f2c",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

export type Rarity = "SSR" | "UR";

// Gradient fill for a rarity wordmark / frame.
export function rarityGradient(rarity: Rarity): string {
  return rarity === "UR"
    ? "linear-gradient(180deg, #ffee99 0%, #ffca4d 46%, #ffa625 100%)"
    : "linear-gradient(180deg, #fac2ff 0%, #f18cff 46%, #e56bff 100%)";
}

// Solid accent for a rarity (borders / glows).
export function rarityAccent(rarity: Rarity): string {
  return rarity === "UR" ? theme.urGold : theme.ssrPink;
}

export function rarityGlow(rarity: Rarity): string {
  return rarity === "UR"
    ? "0 0 24px rgba(255,180,58,0.55)"
    : "0 0 24px rgba(229,107,255,0.55)";
}

// Layered dark outline for white/gradient text on the dark backdrop.
export function darkOutline(w = 2): string {
  const o = theme.outline;
  return [
    `-${w}px -${w}px 0 ${o}`,
    `${w}px -${w}px 0 ${o}`,
    `-${w}px ${w}px 0 ${o}`,
    `${w}px ${w}px 0 ${o}`,
    `0 ${w + 1}px ${w + 2}px rgba(0,0,0,0.55)`,
  ].join(", ");
}

export function accent(caneMode: boolean): string {
  return caneMode ? theme.urGold : theme.cyan;
}
