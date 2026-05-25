/**
 * Phase 4 — interactive story stickers.
 *
 * Stickers are stored per-frame as a JSON array on `stories.stickers`.
 * Coordinates are normalised to the visible frame: x,y ∈ [0,1] (0,0 = top-left
 * of the frame box). `scale` is a relative multiplier; `rotation` is degrees.
 *
 * The id is a stable client-generated string so we can reference stickers
 * (e.g. for poll votes in `story_poll_votes.sticker_id`) without needing a DB
 * row per overlay.
 */

export type StickerBase = {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type PollSticker = StickerBase & {
  type: "poll";
  question: string;
  options: [string, string];
};

export type QuestionSticker = StickerBase & {
  type: "question";
  prompt: string;
};

export type MusicSticker = StickerBase & {
  type: "music";
  title: string;
  artist: string;
  coverUrl?: string | null;
  previewUrl?: string | null;
};

export type EmojiSticker = StickerBase & {
  type: "emoji";
  emoji: string;
};

export type MentionSticker = StickerBase & {
  type: "mention";
  username: string;
};

export type TextStickerStyle = "plain" | "filled" | "outline" | "neon";

export type TextSticker = StickerBase & {
  type: "text";
  text: string;
  color: string;       // hex/hsl text color
  bg?: string | null;  // optional background fill
  style: TextStickerStyle;
  font: "display" | "serif" | "mono";
};

export type Sticker =
  | PollSticker
  | QuestionSticker
  | MusicSticker
  | EmojiSticker
  | MentionSticker
  | TextSticker;

export const newStickerId = () => Math.random().toString(36).slice(2, 11);

export const DEFAULT_STICKER_POS = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };

export const isPoll = (s: Sticker): s is PollSticker => s.type === "poll";
export const isMusic = (s: Sticker): s is MusicSticker => s.type === "music";
