import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { HeroAvatar } from "../components/HeroCard";
import { Heading } from "../components/GameUI";
import { theme, darkOutline } from "../theme";

type Props = {
  chain: string[];
  caneMode: boolean;
};

export const IntroScene: React.FC<Props> = ({ chain, caneMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const swaps = Math.max(0, chain.length - 1);
  const title = caneMode
    ? "HERO SWAP TIME!"
    : "Hero Swap VS Points Walkthrough";
  const caption =
    swaps === 0
      ? caneMode
        ? "Just promote Sarah — no swaps!"
        : "Promotion-only sequence — no swap tokens."
      : caneMode
        ? `${swaps} SWAP${swaps > 1 ? "S" : ""}! LET'S GO!`
        : `The chain: ${swaps} swap${swaps > 1 ? "s" : ""} down the line.`;

  const titleY = interpolate(frame, [0, 26], [34, 0], {
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [0, 26], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div
        style={{
          marginBottom: 54,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
        }}
      >
        <Heading size={46} color={caneMode ? theme.urGold : "#ffffff"}>
          {title}
        </Heading>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1140,
        }}
      >
        {chain.map((name, i) => {
          const appear = spring({
            frame: frame - 32 - i * 20,
            fps,
            config: { damping: 200 },
          });
          const isSarah = i === 0;
          const ring = isSarah ? theme.ssrPink : theme.urGold;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <span
                  style={{
                    fontSize: 42,
                    color: theme.star,
                    opacity: appear,
                    fontWeight: 900,
                    textShadow: darkOutline(2),
                  }}
                >
                  {"→"}
                </span>
              ) : null}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 24px 12px 12px",
                  borderRadius: 16,
                  background: theme.panel,
                  color: "#fff",
                  border: `2px solid ${ring}`,
                  boxShadow: `0 0 16px ${
                    isSarah ? "rgba(229,107,255,0.4)" : "rgba(255,180,58,0.4)"
                  }`,
                  fontSize: 30,
                  fontWeight: 900,
                  textShadow: darkOutline(2),
                  opacity: appear,
                  transform: `scale(${0.7 + appear * 0.3})`,
                }}
              >
                <HeroAvatar name={name} ringColor={ring} size={52} />
                {name}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <Caption text={caption} caneMode={caneMode} />
    </Stage>
  );
};
