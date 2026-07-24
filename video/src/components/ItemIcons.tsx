import React, { useId } from "react";
import { theme, darkOutline } from "../theme";

// True-to-game item icons, drawn as inline SVG so they stay crisp at any size,
// carry no baked-in count numbers, and keep the bundle self-contained.

export type ShardRarity = "SSR" | "UR";

const SHARD_COLORS: Record<
  ShardRarity,
  { light: string; mid: string; dark: string; outline: string }
> = {
  // SSR shards = purple puzzle pieces (Sarah's shards before conversion).
  SSR: { light: "#eeb8ff", mid: "#c25ff0", dark: "#9421c9", outline: "#521178" },
  // UR shards = gold puzzle pieces (after the 2:1 conversion, and later swaps).
  UR: { light: "#ffe79a", mid: "#ffb43a", dark: "#e5871a", outline: "#8f4405" },
};

// A single jigsaw puzzle piece: two tabs (top, right), one socket (left).
const PUZZLE_PATH =
  "M15,15 L45,15 C43,-3 77,-3 75,15 L105,15 L105,45 " +
  "C123,43 123,77 105,75 L105,105 L15,105 L15,75 " +
  "C33,77 33,43 15,45 Z";

export const ShardIcon: React.FC<{ rarity: ShardRarity; size?: number }> = ({
  rarity,
  size = 34,
}) => {
  const c = SHARD_COLORS[rarity];
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 -6 128 120"
      style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.5" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      <path
        d={PUZZLE_PATH}
        fill={`url(#${gid})`}
        stroke={c.outline}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <ellipse
        cx="46"
        cy="44"
        rx="17"
        ry="10"
        fill="#ffffff"
        opacity="0.45"
        transform="rotate(-28 46 44)"
      />
    </svg>
  );
};

function octagon(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = ((22.5 + k * 45) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// Gold octagonal skill medal with a red/white/blue striped ribbon.
export const MedalIcon: React.FC<{ size?: number }> = ({ size = 34 }) => {
  const ring = useId();
  const face = useId();
  const clip = useId();
  return (
    <svg
      width={size}
      height={size * 1.22}
      viewBox="0 0 100 122"
      style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))" }}
    >
      <defs>
        <linearGradient id={ring} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#ffcb3e" />
          <stop offset="1" stopColor="#e59a1a" />
        </linearGradient>
        <linearGradient id={face} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffb057" />
          <stop offset="1" stopColor="#e8791a" />
        </linearGradient>
        <clipPath id={clip}>
          <polygon points="34,17 66,17 60,56 40,56" />
        </clipPath>
      </defs>

      {/* ribbon stripes clipped to a trapezoid */}
      <g clipPath={`url(#${clip})`}>
        <rect x="30" y="15" width="13" height="44" fill="#e8433f" />
        <rect x="43" y="15" width="14" height="44" fill="#f4f4f4" />
        <rect x="57" y="15" width="13" height="44" fill="#3f7fe0" />
      </g>
      <polygon
        points="34,17 66,17 60,56 40,56"
        fill="none"
        stroke="#2a1c12"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* gold top bar */}
      <rect
        x="29"
        y="8"
        width="42"
        height="13"
        rx="4"
        fill={`url(#${ring})`}
        stroke="#2a1c12"
        strokeWidth="4"
      />

      {/* medal */}
      <polygon
        points={octagon(50, 82, 30)}
        fill={`url(#${ring})`}
        stroke="#2a1c12"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <polygon
        points={octagon(50, 82, 19)}
        fill={`url(#${face})`}
        stroke="#a85e12"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="43" cy="75" rx="10" ry="6" fill="#ffffff" opacity="0.4" transform="rotate(-25 43 75)" />
    </svg>
  );
};

// Gold hexagonal "UR" Hero Badge — the promotion consumable (flourish).
export const URBadge: React.FC<{ size?: number }> = ({ size = 44 }) => {
  const gold = useId();
  const hex = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 * Math.PI) / 180;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#ffcb3e" />
          <stop offset="1" stopColor="#e59a1a" />
        </linearGradient>
      </defs>
      <polygon
        points={hex(50, 50, 46)}
        fill={`url(#${gold})`}
        stroke="#8f5a08"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <polygon points={hex(50, 50, 33)} fill="#2a63c4" stroke="#173a7a" strokeWidth="3" strokeLinejoin="round" />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily={theme.fontFamily}
        fontWeight="900"
        fontStyle="italic"
        fontSize="34"
        fill="#ffdca0"
        stroke="#7a4a06"
        strokeWidth="1.5"
      >
        UR
      </text>
    </svg>
  );
};

// The game's inventory item tile: blue rounded tile, icon centred, white count
// in the corner, optional label beneath.
export const ItemTile: React.FC<{
  children: React.ReactNode;
  count?: string;
  label?: string;
  size?: number;
}> = ({ children, count, label, size = 120 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 16,
        background: "linear-gradient(180deg, #5bb4e8 0%, #2f86c9 100%)",
        border: "3px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 3px 0 rgba(255,255,255,0.35), 0 8px 18px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
      {count ? (
        <span
          style={{
            position: "absolute",
            right: 8,
            bottom: 4,
            color: "#fff",
            fontFamily: theme.fontFamily,
            fontWeight: 900,
            fontSize: size * 0.2,
            textShadow: darkOutline(2),
          }}
        >
          {count}
        </span>
      ) : null}
    </div>
    {label ? (
      <span
        style={{
          color: theme.text,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 18,
          textShadow: darkOutline(1),
        }}
      >
        {label}
      </span>
    ) : null}
  </div>
);
