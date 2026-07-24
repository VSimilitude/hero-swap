// Visual language mirrored from the site's style.css. No external assets.

export const theme = {
  bg: "#ffffff",
  panel: "#f8f9fa",
  panelBorder: "#e5e7eb",
  text: "#222222",
  textMuted: "#666666",
  blue: "#2563eb",
  blueDark: "#1e40af",
  star: "#f59e0b",
  ur: "#7c3aed", // UR badge purple
  ssr: "#f97316", // SSR badge orange
  shard: "#0d9488", // shard packet teal
  medal: "#f59e0b",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

// Cane-mode bumps accent saturation and loudness a touch.
export function accent(caneMode: boolean): string {
  return caneMode ? "#1d4ed8" : theme.blue;
}
