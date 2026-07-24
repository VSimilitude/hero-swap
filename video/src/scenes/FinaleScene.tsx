import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroAvatar } from "../components/HeroCard";
import { MedalIcon } from "../components/ItemIcons";
import { theme, darkOutline } from "../theme";

type Props = {
  sources: string[];
  caneMode: boolean;
};

// The game's orange "Congratulations!" banner, a medal shower, and the chain's
// heroes receiving the returned medals.
export const FinaleScene: React.FC<Props> = ({ sources, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bannerPop = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200 },
    durationInFrames: 40,
  });
  const pointsPop = spring({
    frame: frame - 54,
    fps,
    config: { damping: 200 },
  });

  const caption = caneMode
    ? "PUT ALL LEFTOVER MEDALS ON YOUR FAVORITES! POINTS!"
    : `Apply every returned medal (from ${sources.join(", ")}) for VS points.`;

  return (
    <Stage>
      {/* raining medals */}
      {Array.from({ length: 30 }).map((_, i) => {
        const col = (i * 53) % 1220;
        const delay = (i * 5) % 60;
        const p = interpolate(frame, [delay, delay + 90], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(p, [0, 1], [-50, 700]);
        const spin = (frame * 3 + i * 40) % 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: col + 30,
              top: y,
              opacity: 0.95,
              transform: `rotate(${spin}deg)`,
            }}
          >
            <MedalIcon size={28} />
          </div>
        );
      })}

      {/* orange Congratulations banner */}
      <div
        style={{
          position: "relative",
          transform: `scale(${0.7 + bannerPop * 0.3})`,
          opacity: bannerPop,
          zIndex: 2,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            padding: "16px 70px",
            background: `linear-gradient(180deg, #ffc06a 0%, ${theme.bannerOrange} 55%, #e5691a 100%)`,
            border: "3px solid rgba(255,255,255,0.7)",
            borderRadius: 14,
            color: "#fff",
            fontSize: 46,
            fontWeight: 900,
            fontStyle: "italic",
            textShadow: darkOutline(2),
            boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
            letterSpacing: 1,
          }}
        >
          Congratulations!
        </div>
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          fontStyle: "italic",
          color: theme.star,
          transform: `scale(${0.7 + pointsPop * 0.3})`,
          textShadow: darkOutline(3),
          zIndex: 2,
        }}
      >
        VS POINTS!
      </div>

      {/* the chain's heroes receiving the medals */}
      <div
        style={{
          display: "flex",
          gap: 22,
          marginTop: 40,
          zIndex: 2,
          opacity: interpolate(frame, [24, 48], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {sources.map((hero, i) => (
          <HeroAvatar key={i} name={hero} ringColor={theme.urGold} size={92} />
        ))}
      </div>

      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
