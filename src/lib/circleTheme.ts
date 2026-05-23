import type { FriendCircleEnum } from "@/hooks/useFriendCircles";

/**
 * Visual identity for each friend circle. Used to tint story rings,
 * composer chips, and any other circle-aware UI.
 *
 * No purple per project rules. "friends" reuses the signature yellow→red
 * gradient so the default audience still feels native to the app.
 */
export interface CircleTheme {
  label: string;
  /** Single representative color (HSL) — used for solid swatches/dots. */
  hsl: string;
  /** Tailwind-ready gradient used for story rings. */
  ring: string;
  /** Soft glow for active states. */
  glow: string;
}

export type AudienceCircle = FriendCircleEnum | null;

export const CIRCLE_THEMES: Record<FriendCircleEnum, CircleTheme> = {
  private: {
    label: "Private",
    hsl: "220, 80%, 62%",
    ring: "linear-gradient(135deg, hsl(210, 90%, 70%), hsl(220, 80%, 50%))",
    glow: "hsl(220, 80%, 62% / 0.45)",
  },
  family: {
    label: "Family",
    hsl: "150, 60%, 48%",
    ring: "linear-gradient(135deg, hsl(150, 70%, 55%), hsl(170, 70%, 40%))",
    glow: "hsl(150, 60%, 48% / 0.45)",
  },
  friends: {
    label: "Friends",
    hsl: "45, 100%, 50%",
    ring: "linear-gradient(135deg, hsl(45, 100%, 55%), hsl(10, 100%, 55%))",
    glow: "hsl(45, 100%, 50% / 0.5)",
  },
  groups: {
    label: "Groups",
    hsl: "10, 100%, 55%",
    ring: "linear-gradient(135deg, hsl(10, 100%, 60%), hsl(340, 80%, 55%))",
    glow: "hsl(10, 100%, 55% / 0.5)",
  },
};

/** Default ring (yellow→red signature) used when a story is public. */
export const PUBLIC_RING_GRADIENT =
  "linear-gradient(135deg, hsl(45, 100%, 50%), hsl(10, 100%, 55%))";

export const ringGradientFor = (circle: AudienceCircle): string =>
  circle ? CIRCLE_THEMES[circle].ring : PUBLIC_RING_GRADIENT;
