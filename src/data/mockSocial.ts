import type { FriendCircleEnum } from "@/hooks/useFriendCircles";
import type { Sticker } from "@/lib/stickers";

export type StoryMediaType = "music" | "photo" | "video";

export interface StoryFrame {
  url: string;
  caption?: string;
  trackTitle?: string;
  trackArtist?: string;
  /** Database id for the story row backing this frame (when sourced from Supabase). */
  dbId?: string;
  /** ISO timestamp at which this frame expires. Drives the expiry-bleed visual. */
  expiresAt?: string;
  /** Beats-per-minute used to drive the wave-progress pulse on music frames. */
  bpm?: number;
  /** Audience scope for this frame; null = public. Tints the active ring. */
  audienceCircle?: FriendCircleEnum | null;
  /** Filter preset id applied at publish time (see src/lib/storyFilters.ts). */
  filterId?: string | null;
  /** Filter intensity 0..100. */
  filterIntensity?: number;
  /** Phase 4 — interactive sticker overlays (polls, music, emoji…). */
  stickers?: Sticker[];
}

export interface StoryItem {
  id: number;
  username: string;
  avatar: string;
  isOwn?: boolean;
  hasStory?: boolean;
  watched?: boolean;
  mediaType?: StoryMediaType;
  /** Audience scope for the rail tile (last frame's audience). */
  audienceCircle?: FriendCircleEnum | null;
  /** Database user id of the story author (when sourced from Supabase). */
  dbUserId?: string;
  frames?: StoryFrame[];
}

export const stories: StoryItem[] = [
  { id: 1, username: "My Story", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isOwn: true, hasStory: false },
  { id: 2, username: "Lina", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", hasStory: true, mediaType: "music", frames: [
    { url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1400&fit=crop", trackTitle: "Velvet Hours", trackArtist: "Lina" },
    { url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1400&fit=crop", caption: "Studio sessions tonight" },
  ]},
  { id: 3, username: "Ahmed", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", hasStory: true, mediaType: "photo", frames: [
    { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop", caption: "Golden hour" },
    { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1400&fit=crop" },
    { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1400&fit=crop", caption: "On the road" },
  ]},
  { id: 4, username: "Jenny", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", hasStory: true, watched: true, mediaType: "video", frames: [
    { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=1400&fit=crop", caption: "Behind the scenes" },
  ]},
  { id: 5, username: "Linda", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", hasStory: true, mediaType: "video", frames: [
    { url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=1400&fit=crop", caption: "Late night code" },
    { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=1400&fit=crop" },
  ]},
  { id: 6, username: "Karim", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", hasStory: true, watched: true, mediaType: "photo", frames: [
    { url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=1400&fit=crop", caption: "Gallery night" },
  ]},
];

export interface Highlight {
  id: number;
  label: string;
  cover: string;
}

export const highlights: Highlight[] = [
  { id: 1, label: "Travel", cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop" },
  { id: 2, label: "Music", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" },
  { id: 3, label: "Code", cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop" },
  { id: 4, label: "Art", cover: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop" },
  { id: 5, label: "Build", cover: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop" },
];

export const trendingTags = [
  { tag: "#designsystem", posts: "12.4k posts" },
  { tag: "#neumorphism", posts: "8.1k posts" },
  { tag: "#fullstack", posts: "24k posts" },
  { tag: "#ambient", posts: "3.2k posts" },
];

export interface SuggestedUser {
  username: string;
  name: string;
  avatar: string;
}

export const suggestedUsers: SuggestedUser[] = [
  { username: "alex.codes", name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" },
  { username: "lina_b", name: "Lina B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" },
  { username: "mr.synth", name: "Synth Master", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop" },
];

export interface FollowUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
}

export const followUsers: FollowUser[] = [
  { id: 1, username: "sarah_designs", name: "Sarah Lee", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: 2, username: "mike_photos", name: "Mike Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: 3, username: "creative_jane", name: "Jane Doe", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: 4, username: "djsoul", name: "DJ Soul", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop" },
  { id: 5, username: "linda.k", name: "Linda K", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
];

export const exploreImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=600&fit=crop",
];
