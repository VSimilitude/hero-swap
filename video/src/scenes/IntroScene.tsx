import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/Stage";
import { Caption } from "../components/Caption";
import { theme } from "../theme";

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

  const titleY = interpolate(frame, [0, 18], [30, 0], {
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div
        style={{
          fontSize: 46,
          fontWeight: 800,
          color: theme.blueDark,
          marginBottom: 50,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1100,
        }}
      >
        {chain.map((name, i) => {
          const appear = spring({
            frame: frame - 20 - i * 12,
            fps,
            config: { damping: 200 },
          });
          const isSarah = i === 0;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <span
                  style={{
                    fontSize: 40,
                    color: theme.blue,
                    opacity: appear,
                    fontWeight: 800,
                  }}
                >
                  {"→"}
                </span>
              ) : null}
              <div
                style={{
                  padding: "16px 26px",
                  borderRadius: 12,
                  background: isSarah ? theme.blue : theme.panel,
                  color: isSarah ? "#fff" : theme.text,
                  border: `2px solid ${isSarah ? theme.blueDark : theme.panelBorder}`,
                  fontSize: 30,
                  fontWeight: 700,
                  opacity: appear,
                  transform: `scale(${0.7 + appear * 0.3})`,
                }}
              >
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
