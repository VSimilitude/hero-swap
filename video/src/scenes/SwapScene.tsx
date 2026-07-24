import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroCard } from "../components/HeroCard";
import { RarityWord } from "../components/RarityWord";
import { ShardIcon, MedalIcon } from "../components/ItemIcons";
import { SwapEvent } from "../plan";
import { theme, darkOutline } from "../theme";

// Shard cluster offsets: 6 SSR pieces convert 2:1 into 3 UR pieces.
const PURPLE_OFF: [number, number][] = [
  [-32, -16], [0, -22], [32, -16], [-32, 14], [0, 20], [32, 14],
];
const GOLD_OFF: [number, number][] = [[-30, -4], [0, -12], [30, -4]];

type Props = {
  event: SwapEvent;
  maxHero: string | null;
  caneMode: boolean;
};

// Two hero cards exchange star levels; a shard packet slides carrier→target.
// A "medals maxed ✓" beat opens the scene (the folded max_medals event).
export const SwapScene: React.FC<Props> = ({ event, maxHero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { carrier, target, first, conversion } = event;

  // Beat 1 (0–66): "medals maxed" tag on the target.
  const beatIn = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const beatOut = interpolate(frame, [54, 68], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beatOpacity = maxHero ? beatIn * beatOut : 0;

  // Beat 2 (72–160): the swap. Star levels cross over, slowly and legibly.
  const swapP = spring({
    frame: frame - 72,
    fps,
    config: { damping: 200 },
    durationInFrames: 84,
  });
  const carrierStars = Math.round(interpolate(swapP, [0, 1], [3, 5]));
  const targetStars = Math.round(interpolate(swapP, [0, 1], [5, 3]));

  // Shard cluster glides left→right during the swap.
  const packetX = interpolate(swapP, [0, 1], [330, 636]);
  const packetVisible = frame > 72 && frame < 214;

  // First swap: SSR (purple) shards convert 2:1 to UR (gold) mid-flight.
  const convAt = 0.52;
  const purpleOp = first
    ? interpolate(swapP, [0, convAt - 0.05, convAt + 0.05], [1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const goldOp = first
    ? interpolate(swapP, [convAt - 0.02, convAt + 0.14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const flash = first
    ? interpolate(swapP, [convAt - 0.06, convAt, convAt + 0.1], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Conversion badge (first swap only) fades in as the packet lands.
  const badgeP = interpolate(frame, [150, 174], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const arrowGlow = interpolate(Math.sin(frame / 7), [-1, 1], [8, 22]);

  const caption = caneMode
    ? `SWAP ${carrier} WITH ${target}! WHOOOOSH!`
    : `Swap ${carrier} (3★) with ${target} (5★): stars trade, shards ride to ${target}${
        first ? " and convert SSR→UR (2:1)" : ""
      }.`;

  return (
    <Stage>
      <div style={{ position: "relative", width: 980, height: 460 }}>
        <div style={{ position: "absolute", left: 40, top: 70 }}>
          <HeroCard
            name={carrier}
            stars={carrierStars}
            rarity="UR"
            highlight={carrierStars === 5}
          />
        </div>
        <div style={{ position: "absolute", right: 40, top: 70 }}>
          <HeroCard
            name={target}
            stars={targetStars}
            rarity="UR"
            highlight={targetStars === 3}
          />
        </div>

        {/* glossy swap arrow */}
        <div
          style={{
            position: "absolute",
            left: 442,
            top: 168,
            width: 96,
            height: 96,
            borderRadius: 48,
            background: `linear-gradient(180deg, ${theme.cyanLight}, ${theme.cyanDark})`,
            border: "3px solid rgba(255,255,255,0.7)",
            boxShadow: `inset 0 3px 0 rgba(255,255,255,0.55), 0 0 ${arrowGlow}px rgba(126,216,247,0.85), 0 8px 18px rgba(0,0,0,0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 52,
            fontWeight: 900,
            textShadow: darkOutline(2),
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {"⇄"}
        </div>

        {/* shard cluster (SSR purple pieces → UR gold pieces, 2:1) */}
        {packetVisible ? (
          <div style={{ position: "absolute", left: packetX, top: 250 }}>
            {/* conversion flash */}
            {first ? (
              <div
                style={{
                  position: "absolute",
                  left: -50,
                  top: -50,
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  background:
                    "radial-gradient(circle, rgba(255,232,150,0.95) 0%, rgba(255,180,58,0) 68%)",
                  opacity: flash,
                  transform: `scale(${0.5 + flash * 1.3})`,
                }}
              />
            ) : null}
            {/* SSR purple pieces */}
            {purpleOp > 0
              ? PURPLE_OFF.map(([ox, oy], i) => (
                  <div
                    key={`p${i}`}
                    style={{ position: "absolute", left: ox, top: oy, opacity: purpleOp }}
                  >
                    <ShardIcon rarity="SSR" size={30} />
                  </div>
                ))
              : null}
            {/* UR gold pieces (half as many) */}
            {goldOp > 0
              ? GOLD_OFF.map(([ox, oy], i) => (
                  <div
                    key={`g${i}`}
                    style={{
                      position: "absolute",
                      left: ox,
                      top: oy,
                      opacity: goldOp,
                      transform: `scale(${0.75 + goldOp * 0.25})`,
                    }}
                  >
                    <ShardIcon rarity="UR" size={34} />
                  </div>
                ))
              : null}
          </div>
        ) : null}

        {/* conversion badge on first swap */}
        {first ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -6,
              display: "flex",
              justifyContent: "center",
              opacity: badgeP,
              transform: `scale(${0.85 + badgeP * 0.15})`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(12,14,34,0.85)",
                border: "2px solid rgba(255,255,255,0.2)",
                padding: "10px 22px",
                borderRadius: 12,
                boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
              }}
            >
              <RarityWord rarity="SSR" size={26} />
              <span style={{ color: "#fff", fontSize: 26, fontWeight: 900 }}>{"→"}</span>
              <RarityWord rarity="UR" size={26} />
              <span
                style={{
                  color: theme.star,
                  fontSize: 24,
                  fontWeight: 900,
                  textShadow: darkOutline(1),
                }}
              >
                {conversion}
              </span>
            </div>
          </div>
        ) : null}

        {/* medals-maxed beat tag */}
        {maxHero ? (
          <div
            style={{
              position: "absolute",
              right: 70,
              top: 16,
              background: `linear-gradient(180deg, ${theme.urGoldLight}, ${theme.urGold})`,
              color: theme.outline,
              fontWeight: 900,
              fontSize: 22,
              padding: "8px 16px",
              borderRadius: 10,
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
              opacity: beatOpacity,
              transform: `scale(${0.8 + beatOpacity * 0.2})`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MedalIcon size={26} />
            {`${maxHero} medals maxed ✓`}
          </div>
        ) : null}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
