import React, { useState } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { RarityWord } from "../components/RarityWord";
import { Heading, GameButton, StarFan, MaxBadge } from "../components/GameUI";
import { MedalIcon, ShardIcon, URBadge } from "../components/ItemIcons";
import { portraitFor } from "../portraits";
import { theme, darkOutline, rarityAccent, rarityGlow } from "../theme";

type Props = {
  hero: string;
  caneMode: boolean;
};

const SKILL_COLORS = ["#7b57d6", "#4f7bd6", "#8a5ad6", "#d68a3a"];

const clampBoth = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// Medal-refund schedule (frames). Each of the four skill boxes drains its star
// fan and releases its medals in turn, slightly overlapping, all within the
// 180-frame budget. The last box (i=3) drains 135->157 and its last medal
// lands ~176, leaving a few frames of settle.
const RELEASE_BASE = 102; // first box begins after the promote press (~96)
const BOX_STAGGER = 11; // per-box offset (overlap between boxes)
const DRAIN_FRAMES = 22; // star fan grey-out / MAX drop duration per box
const MEDAL_TRAVEL = 30; // frames for a medal to arc to the mailbox

// Canvas-space anchors (1280x720). The skill boxes frame the centred portrait;
// medals launch from each box, hero shards from the portrait, both arcing to
// the mailbox in the top-right. Tuned against the rendered layout.
const BOXES = [
  { x: 410, y: 214 }, // top-left
  { x: 872, y: 214 }, // top-right
  { x: 410, y: 384 }, // bottom-left
  { x: 872, y: 384 }, // bottom-right
];
const MAILBOX_PT = { x: 1188, y: 82 };
const PORTRAIT_PT = { x: 622, y: 320 };

// One skill box: gold-starred maxed icon that de-levels as `drain` (0..1) rises
// — stars grey out one by one, the box desaturates, and the MAX badge drops.
const SkillIcon: React.FC<{ color: string; drain: number }> = ({ color, drain }) => {
  const lit = Math.round(5 * (1 - drain));
  const badgeDrop = interpolate(drain, [0.5, 1], [0, 1], clampBoth);
  const glow = interpolate(drain, [0, 0.8], [0.4, 0], clampBoth);
  const drained = drain > 0.5;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <StarFan size={12} lit={lit} />
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 12,
          background: `linear-gradient(150deg, ${color}, #23213f)`,
          border: `2px solid ${drained ? "rgba(180,182,205,0.6)" : "#ffd24d"}`,
          boxShadow: `0 0 10px rgba(255,210,77,${glow})`,
          filter: `grayscale(${drain * 0.75}) brightness(${1 - drain * 0.28})`,
        }}
      />
      <div style={{ transform: `translateY(${badgeDrop * 16}px)`, opacity: 1 - badgeDrop }}>
        <MaxBadge />
      </div>
    </div>
  );
};

const Portrait: React.FC<{ hero: string; accent: string; glow: string }> = ({
  hero,
  accent,
  glow,
}) => {
  const url = portraitFor(hero);
  const [failed, setFailed] = useState(false);
  const box: React.CSSProperties = {
    width: 210,
    height: 250,
    borderRadius: 16,
    border: `3px solid ${accent}`,
    boxShadow: `${glow}, 0 10px 26px rgba(0,0,0,0.5)`,
    objectFit: "cover",
    background: theme.panelSolid,
  };
  if (url && !failed) {
    return <img src={url} alt={hero} onError={() => setFailed(true)} style={box} />;
  }
  return (
    <div
      style={{
        ...box,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 96,
        fontWeight: 900,
        textShadow: darkOutline(3),
      }}
    >
      {hero.slice(0, 1).toUpperCase()}
    </div>
  );
};

// A stylized version of the real Hero Promotion screen: heading, gold UR
// wordmark + name, prominent portrait framed with maxed skill icons, pink SSR
// footnote, and a glossy cyan Promote button that gets pressed — then the star
// drop (5★ → 3★) and the medal/shard return to the mailbox.
export const PromoteScene: React.FC<Props> = ({ hero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button press around frame 78, promotion transition from frame 96.
  const press = interpolate(frame, [72, 84, 96], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const promoteT = spring({
    frame: frame - 96,
    fps,
    config: { damping: 200 },
    durationInFrames: 45,
  });
  const isUR = promoteT > 0.15;
  const rarity = isUR ? "UR" : "SSR";
  const accent = rarityAccent(rarity);
  const glow = rarityGlow(rarity);
  const stars = Math.round(interpolate(promoteT, [0, 1], [5, 3]));
  // Crossfade SSR->UR wordmarks rather than swapping the rarity prop on a
  // single gradient-clipped element (avoids a transition-frame repaint glitch).
  const urMix = interpolate(promoteT, [0.1, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const caption = caneMode
    ? "PROMOTE SARAH TO UR! BOOM!"
    : `Promote ${hero} to UR — she drops to 3★ and returns all medals + shards to the mailbox.`;

  // Per-box drain progress (0..1): drives both the visual de-level and the
  // matching medal release, so stars empty in sync with the medals leaving.
  const boxDrain = BOXES.map((_, i) =>
    interpolate(
      frame,
      [RELEASE_BASE + i * BOX_STAGGER, RELEASE_BASE + i * BOX_STAGGER + DRAIN_FRAMES],
      [0, 1],
      clampBoth,
    ),
  );

  const introRise = interpolate(frame, [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });
  const introFade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div
        style={{
          position: "relative",
          width: 780,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          transform: `translateY(${introRise}px)`,
          opacity: introFade,
        }}
      >
        <Heading size={40}>Hero Promotion</Heading>

        {/* rarity wordmark (crossfaded SSR->UR) + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 66, height: 46 }}>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - urMix }}>
              <RarityWord rarity="SSR" size={44} />
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: urMix }}>
              <RarityWord rarity="UR" size={44} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ color: theme.textMuted, fontSize: 16, fontWeight: 700 }}>
              Machinegun Phantom
            </span>
            <span
              style={{
                color: "#fff",
                fontSize: 30,
                fontWeight: 900,
                textShadow: darkOutline(2),
              }}
            >
              {hero}
            </span>
          </div>
        </div>

        {/* portrait framed by maxed skill icons */}
        <div style={{ position: "relative", width: 520, height: 270 }}>
          <div
            style={{
              position: "absolute",
              left: 155,
              top: 8,
              transform: `scale(${0.96 + promoteT * 0.04})`,
            }}
          >
            <Portrait hero={hero} accent={accent} glow={glow} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 10 }}>
            <SkillIcon color={SKILL_COLORS[0]} drain={boxDrain[0]} />
          </div>
          <div style={{ position: "absolute", right: 0, top: 10 }}>
            <SkillIcon color={SKILL_COLORS[1]} drain={boxDrain[1]} />
          </div>
          <div style={{ position: "absolute", left: 0, bottom: 0 }}>
            <SkillIcon color={SKILL_COLORS[2]} drain={boxDrain[2]} />
          </div>
          <div style={{ position: "absolute", right: 0, bottom: 0 }}>
            <SkillIcon color={SKILL_COLORS[3]} drain={boxDrain[3]} />
          </div>
        </div>

        {/* star row (drops 5 -> 3 on promotion) */}
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: 30,
                color: i < stars ? theme.star : "rgba(255,255,255,0.2)",
                textShadow: i < stars ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
              }}
            >
              {"★"}
            </span>
          ))}
        </div>

        {/* pink SSR footnote */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RarityWord rarity="SSR" size={24} />
          <span style={{ color: theme.textMuted, fontSize: 17, fontWeight: 600 }}>
            {isUR
              ? `${hero} promoted from SSR to UR`
              : `${hero} can be promoted after reaching 5 stars`}
          </span>
        </div>

        {/* Promote button + UR Hero Badge consumable */}
        <div
          style={{
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <GameButton
            label={isUR ? "Promoted" : "Promote"}
            pressed={press > 0.4}
            glow={interpolate(Math.sin(frame / 6), [-1, 1], [6, 18])}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <URBadge size={34} />
            <span
              style={{
                color: theme.star,
                fontSize: 20,
                fontWeight: 900,
                textShadow: darkOutline(1),
              }}
            >
              1/1
            </span>
          </div>
        </div>
      </div>

      {/* refunded skill medals launch FROM each skill box, staggered per box,
          arcing to the mailbox as that box's stars drain (2 medals per box) */}
      {BOXES.flatMap((box, i) => {
        const dStart = RELEASE_BASE + i * BOX_STAGGER;
        return [0, 1].map((k) => {
          const start = dStart + 3 + k * 8;
          const p = interpolate(frame, [start, start + MEDAL_TRAVEL], [0, 1], clampBoth);
          if (p <= 0 || p >= 1) return null;
          const ex = MAILBOX_PT.x + (i - 1.5) * 8 + k * 4;
          const x = interpolate(p, [0, 1], [box.x, ex]) - 15;
          const y =
            interpolate(p, [0, 1], [box.y, MAILBOX_PT.y]) - Math.sin(p * Math.PI) * 46 - 18;
          const opacity = interpolate(p, [0, 0.12, 0.85, 1], [0, 1, 1, 0], clampBoth);
          const scale = interpolate(p, [0, 1], [1, 0.7]);
          return (
            <div
              key={`medal-${i}-${k}`}
              style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${scale})` }}
            >
              <MedalIcon size={30} />
            </div>
          );
        });
      })}

      {/* hero shards keep flowing from Sarah's portrait to the mailbox */}
      {[0, 1, 2, 3].map((s) => {
        const start = 104 + s * 9;
        const p = interpolate(frame, [start, start + MEDAL_TRAVEL], [0, 1], clampBoth);
        if (p <= 0 || p >= 1) return null;
        const ex = MAILBOX_PT.x + (s - 1.5) * 10;
        const x = interpolate(p, [0, 1], [PORTRAIT_PT.x + (s - 1.5) * 22, ex]) - 17;
        const y =
          interpolate(p, [0, 1], [PORTRAIT_PT.y + (s % 2) * 24, MAILBOX_PT.y]) -
          Math.sin(p * Math.PI) * 40 -
          17;
        const opacity = interpolate(p, [0, 0.12, 0.85, 1], [0, 1, 1, 0], clampBoth);
        const scale = interpolate(p, [0, 1], [1, 0.72]);
        return (
          <div
            key={`shard-${s}`}
            style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${scale})` }}
          >
            <ShardIcon rarity="SSR" size={34} />
          </div>
        );
      })}

      {/* mailbox target */}
      <div
        style={{
          position: "absolute",
          right: 44,
          top: 44,
          width: 96,
          height: 70,
          borderRadius: 12,
          background: `linear-gradient(180deg, ${theme.cyan}, ${theme.cyanDark})`,
          border: "2px solid rgba(255,255,255,0.6)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 0.5,
          textShadow: darkOutline(1),
          boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
        }}
      >
        MAILBOX
      </div>

      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
