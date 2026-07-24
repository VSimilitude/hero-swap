import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroCard } from "../components/HeroCard";
import { theme } from "../theme";

type Props = {
  hero: string;
  caneMode: boolean;
};

// Sarah SSR 5★ → UR 3★; medals + shards fly to the mailbox.
export const PromoteScene: React.FC<Props> = ({ hero, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Promotion "flip" happens around frame 45.
  const flip = spring({ frame: frame - 45, fps, config: { damping: 200 } });
  const isUR = flip > 0.5;
  const stars = isUR ? 3 : 5;

  const caption = caneMode
    ? "PROMOTE SARAH TO UR! BOOM!"
    : `Promote ${hero} to UR — she drops to 3★, medals + shards fly to the mailbox.`;

  return (
    <Stage>
      <div style={{ position: "relative", width: 800, height: 420 }}>
        <div
          style={{
            position: "absolute",
            left: 270,
            top: 40,
            transform: `rotateY(${flip * 180}deg)`,
          }}
        >
          <HeroCard
            name={hero}
            stars={stars}
            rarity={isUR ? "UR" : "SSR"}
            highlight
          />
        </div>

        {/* Flying medal + shard tokens toward the mailbox (top-right). */}
        {Array.from({ length: 6 }).map((_, i) => {
          const start = 48 + i * 3;
          const p = interpolate(frame, [start, start + 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isShard = i % 2 === 0;
          const x = interpolate(p, [0, 1], [400, 720 + (i % 3) * 10]);
          const y = interpolate(p, [0, 1], [200, 20]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 30,
                height: 30,
                borderRadius: isShard ? 6 : 15,
                background: isShard ? theme.shard : theme.medal,
                opacity: p > 0 && p < 1 ? 1 : 0,
                transform: `scale(${1 - p * 0.3})`,
              }}
            />
          );
        })}

        {/* Mailbox target */}
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 0,
            width: 90,
            height: 66,
            borderRadius: 10,
            background: theme.blueDark,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          MAILBOX
        </div>
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
