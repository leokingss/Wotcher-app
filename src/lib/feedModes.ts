import { Clock, Flame, Sparkles, LucideIcon } from "lucide-react";

// The three feed algorithms — the core of "Others decide what you see. We let you decide."
// Shared between the header picker, the feed page caption and the saved user preference.

export type FeedModeId = 1 | 2 | 3;
export type FeedModeKey = "live" | "popular" | "algorithm";

export interface FeedMode {
  id: FeedModeId;
  key: FeedModeKey;
  label: string;
  tagline: string;
  Icon: LucideIcon;
}

export const FEED_MODES: FeedMode[] = [
  {
    id: 1,
    key: "live",
    label: "Latest",
    tagline: "Newest first — pure chronological, nothing hidden",
    Icon: Clock,
  },
  {
    id: 2,
    key: "popular",
    label: "Popular",
    tagline: "Ranked by likes and buzz across Wotcher",
    Icon: Flame,
  },
  {
    id: 3,
    key: "algorithm",
    label: "For You",
    tagline: "Shaped by what you like, listen to and save",
    Icon: Sparkles,
  },
];

export const TAB_TO_MODE: Record<FeedModeId, FeedModeKey> = {
  1: "live",
  2: "popular",
  3: "algorithm",
};

export const MODE_TO_TAB: Record<FeedModeKey, FeedModeId> = {
  live: 1,
  popular: 2,
  algorithm: 3,
};

export const feedModeByTab = (tab: number): FeedMode =>
  FEED_MODES.find((m) => m.id === tab) ?? FEED_MODES[0];

export const feedModeByKey = (key: string | null | undefined): FeedMode =>
  FEED_MODES.find((m) => m.key === key) ?? FEED_MODES[0];
