import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroCard } from "../components/HeroCard";
import { SwapEvent } from "../plan";
import { theme } from "../theme";

type Props = {
  event: SwapEvent;
  maxHero: string | null;
  caneMode: boolean;
};

// Two hero cards exchange star levels; shard packet slides carrier→target.
// A brief "medals maxed ✓" beat opens the scene (the folded max_medals event).
export const SwapScene: React.FC<Props> = ({ event, maxHero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { carrier, target, first, conversion } = event;

  // Beat 1 (0–36): "medals maxed" tag on the target.
  const beatIn = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const beatOut = interpolate(frame, [30, 40], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beatOpacity = maxHero ? beatIn * beatOut : 0;

  // Beat 2 (40–110): the swap. Star levels cross over.
  const swapP = spring({
    frame: frame - 44,
    fps,
    config: { damping: 200 },
    durationInFrames: 55,
  });
  const carrierStars = Math.round(interpolate(swapP, [0, 1], [3, 5]));
  const targetStars = Math.round(interpolate(swapP, [0, 1], [5, 3]));

  // Shard packet glides left→right during the swap.
  const packetX = interpolate(swapP, [0, 1], [330, 690]);
  const packetVisible = frame > 44 && frame < 130;

  // Conversion badge (first swap only) fades in as the packet lands.
  const badgeP = interpolate(frame, [95, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const caption = caneMode
    ? `SWAP ${carrier} WITH ${target}! WHOOOOSH!`
    : `Swap ${carrier} (3★) with ${target} (5★): stars trade, shards ride to ${target}${
        first ? " and convert SSR→UR (2:1)" : ""
      }.`;

  return (
    <Stage>
      <div style={{ position: "relative", width: 900, height: 440 }}>
        <div style={{ position: "absolute", left: 60, top: 60 }}>
          <HeroCard
            name={carrier}
            stars={carrierStars}
            rarity="UR"
            highlight={carrierStars === 5}
          />
        </div>
        <div style={{ position: "absolute", right: 60, top: 60 }}>
          <HeroCard
            name={target}
            stars={targetStars}
            rarity="UR"
            highlight={targetStars === 3}
          />
        </div>

        {/* swap arrows */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 20,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 800,
            color: theme.blue,
            opacity: interpolate(frame, [40, 52], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {"⇄"}
        </div>

        {/* shard packet */}
        {packetVisible ? (
          <div
            style={{
              position: "absolute",
              left: packetX,
              top: 210,
              width: 56,
              height: 40,
              borderRadius: 8,
              background: theme.shard,
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(13,148,136,0.4)",
            }}
          >
            SHARDS
          </div>
        ) : null}

        {/* conversion badge on first swap */}
        {first ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              textAlign: "center",
              opacity: badgeP,
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: theme.ssr,
                color: "#fff",
                fontWeight: 800,
                fontSize: 24,
                padding: "8px 18px",
                borderRadius: 10,
              }}
            >
              {`SSR → UR (${conversion})`}
            </span>
          </div>
        ) : null}

        {/* medals-maxed beat tag */}
        {maxHero ? (
          <div
            style={{
              position: "absolute",
              right: 90,
              top: 20,
              background: theme.medal,
              color: "#fff",
              fontWeight: 800,
              fontSize: 22,
              padding: "8px 16px",
              borderRadius: 10,
              opacity: beatOpacity,
              transform: `scale(${0.8 + beatOpacity * 0.2})`,
            }}
          >
            {`${maxHero} medals maxed ✓`}
          </div>
        ) : null}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
