// ---------------------------------------------------------------------------
// Phase 2 seed data — Profile anthems, post track replies, seller vibe tracks
// and community playlists. All client-side; persisted in localStorage via
// useMusicMeta. Track ids reference src/data/mockCharts.ts -> sampleTracks.
// ---------------------------------------------------------------------------

export interface TrackReply {
  trackId: string;
  userId: string;          // mock id
  username: string;
  avatar: string;
  at: number;              // ms timestamp
}

export interface PlaylistContributor {
  id: string;
  username: string;
  avatar: string;
}

export interface PlaylistEntry {
  trackId: string;
  addedBy: string;         // contributor username
  at: number;
}

export interface CommunityPlaylist {
  id: string;
  title: string;
  subtitle: string;        // e.g. "Sunday Sounds Group"
  cover: string;
  contributors: PlaylistContributor[];
  entries: PlaylistEntry[];
}

// username -> trackId
export const seededAnthems: Record<string, string> = {
  maya: "t4",
  karim_k: "t2",
  lina: "t1",
  jenny_p: "t6",
  ahmed_n: "t5",
  linda: "t14",
};

// postId -> reply list. Real posts come from Supabase so seed defaults are
// keyed by simple slugs; the hook merges live state per-postId on demand.
export const seededTrackReplies: Record<string, TrackReply[]> = {};

const A = (id: string, u: string, name: string, avatar: string): PlaylistContributor => ({
  id, username: u, avatar,
});

const C1 = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop";
const C2 = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop";
const C3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop";
const C4 = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop";
const C5 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop";

export const seededPlaylists: CommunityPlaylist[] = [
  {
    id: "pl-sunday",
    title: "Sunday Sounds",
    subtitle: "Sunday Sounds Group · 412 listeners",
    cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=400&fit=crop",
    contributors: [
      A("u-maya", "maya", "Maya", C1),
      A("u-karim", "karim_k", "Karim", C2),
      A("u-lina", "lina", "Lina", C3),
      A("u-jenny", "jenny_p", "Jenny", C4),
    ],
    entries: [
      { trackId: "t1", addedBy: "lina", at: Date.now() - 86400000 * 6 },
      { trackId: "t4", addedBy: "maya", at: Date.now() - 86400000 * 5 },
      { trackId: "t6", addedBy: "jenny_p", at: Date.now() - 86400000 * 4 },
      { trackId: "t13", addedBy: "karim_k", at: Date.now() - 86400000 * 3 },
      { trackId: "t11", addedBy: "maya", at: Date.now() - 86400000 * 1 },
    ],
  },
  {
    id: "pl-late",
    title: "Late Night Index",
    subtitle: "Insomniacs Circle · 218 listeners",
    cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&h=400&fit=crop",
    contributors: [
      A("u-karim", "karim_k", "Karim", C2),
      A("u-ahmed", "ahmed_n", "Ahmed", C5),
      A("u-linda", "linda", "Linda", C1),
    ],
    entries: [
      { trackId: "t10", addedBy: "karim_k", at: Date.now() - 86400000 * 9 },
      { trackId: "t8", addedBy: "ahmed_n", at: Date.now() - 86400000 * 7 },
      { trackId: "t14", addedBy: "linda", at: Date.now() - 86400000 * 5 },
      { trackId: "t12", addedBy: "ahmed_n", at: Date.now() - 86400000 * 2 },
    ],
  },
  {
    id: "pl-coffee",
    title: "Coffee Bar Loops",
    subtitle: "Slow Mornings Group · 96 listeners",
    cover: "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?w=400&h=400&fit=crop",
    contributors: [
      A("u-jenny", "jenny_p", "Jenny", C4),
      A("u-lina", "lina", "Lina", C3),
    ],
    entries: [
      { trackId: "t9", addedBy: "lina", at: Date.now() - 86400000 * 10 },
      { trackId: "t7", addedBy: "jenny_p", at: Date.now() - 86400000 * 8 },
      { trackId: "t15", addedBy: "lina", at: Date.now() - 86400000 * 3 },
    ],
  },
];
