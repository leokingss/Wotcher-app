// ---------------------------------------------------------------------------
// Phase 5 seed data — official accounts, broadcasts, group buys.
// All client-side; persisted via Phase 5 hooks (localStorage).
// ---------------------------------------------------------------------------

export interface Broadcast {
  id: string;
  from: string;            // username
  fromAvatar: string;
  title: string;
  body: string;
  cover?: string;
  at: number;              // ms
}

export interface OfficialAccount {
  username: string;
  category: "artist" | "brand" | "label";
  tagline: string;
  followers: number;       // for display
  anthemTrackId?: string;
  featuredTrackIds: string[];
}

export const OFFICIAL_ACCOUNTS: Record<string, OfficialAccount> = {
  maya: {
    username: "maya",
    category: "artist",
    tagline: "Indie pop · London",
    followers: 124300,
    anthemTrackId: "t4",
    featuredTrackIds: ["t4", "t1", "t11"],
  },
  karim_k: {
    username: "karim_k",
    category: "artist",
    tagline: "Producer · sandlight era",
    followers: 87900,
    anthemTrackId: "t2",
    featuredTrackIds: ["t2", "t13", "t5"],
  },
  jenny_p: {
    username: "jenny_p",
    category: "brand",
    tagline: "Sound-first label",
    followers: 41200,
    anthemTrackId: "t6",
    featuredTrackIds: ["t6", "t14"],
  },
};

export const seededBroadcasts: Broadcast[] = [
  {
    id: "bc-1",
    from: "maya",
    fromAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Maya",
    title: "New single drops Friday 🎧",
    body: "Pre-save now — first 500 get a hidden acoustic cut in their wallet.",
    cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=400&fit=crop",
    at: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "bc-2",
    from: "karim_k",
    fromAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Karim",
    title: "Going live tonight, 8pm GMT",
    body: "Behind-the-scenes of the Sandlight sessions + Q&A.",
    at: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: "bc-3",
    from: "jenny_p",
    fromAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Jenny",
    title: "Studio shop restock — Sunday 10am",
    body: "Limited tape runs, signed sleeves. £5 off if you're a follower.",
    at: Date.now() - 1000 * 60 * 60 * 26,
  },
];

// ---------- Group buy ---------------------------------------------------------

export interface GroupBuy {
  id: string;
  listingId?: string;      // hook to existing listing or standalone
  title: string;
  cover: string;
  soloPrice: number;
  groupPrice: number;
  required: number;        // e.g. 3
  members: { username: string; avatar: string; at: number }[];
  endsAt: number;          // ms
  status: "open" | "succeeded" | "expired";
}

const a = (u: string, s: string) => ({
  username: u,
  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${s}`,
  at: Date.now() - 1000 * 60 * 30,
});

export const seededGroupBuys: GroupBuy[] = [
  {
    id: "gb-1",
    title: "Sandlight · Limited tape",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    soloPrice: 24,
    groupPrice: 18,
    required: 3,
    members: [a("lina", "Lina"), a("ahmed_n", "Ahmed")],
    endsAt: Date.now() + 1000 * 60 * 60 * 18,
    status: "open",
  },
  {
    id: "gb-2",
    title: "Maya · Signed sleeve bundle",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    soloPrice: 45,
    groupPrice: 35,
    required: 4,
    members: [a("karim_k", "Karim")],
    endsAt: Date.now() + 1000 * 60 * 60 * 30,
    status: "open",
  },
];
