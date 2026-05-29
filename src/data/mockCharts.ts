// ---------------------------------------------------------------------------
// Mock data for the Top 10 Charts feature (Phase 1).
// All client-side; no backend writes. Used by /charts and the charts store.
// ---------------------------------------------------------------------------

export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
}

export interface FriendChart {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  top10Ids: string[]; // ordered Track ids
}

export interface GlobalChartEntry {
  trackId: string;
  points: number;        // weighted votes across all charts
  appearances: number;   // how many charts include it
  voters: number;        // total people who placed it (display nicety)
  movement: number;      // weekly delta in chart position
  isNew?: boolean;
}

const COVERS = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=300&h=300&fit=crop",
];

export const sampleTracks: Track[] = [
  { id: "t1",  title: "Velvet Hours",     artist: "Lina Mareau",     artwork: COVERS[0] },
  { id: "t2",  title: "Sandlight",        artist: "Karim K",         artwork: COVERS[1] },
  { id: "t3",  title: "Paper Planes",     artist: "The Bevels",      artwork: COVERS[2] },
  { id: "t4",  title: "Slow Motion",      artist: "Maya Otero",      artwork: COVERS[3] },
  { id: "t5",  title: "Glass Sunday",     artist: "Ahmed N.",        artwork: COVERS[4] },
  { id: "t6",  title: "Bloomroom",        artist: "Jenny Park",      artwork: COVERS[5] },
  { id: "t7",  title: "Northbound",       artist: "Linda Sole",      artwork: COVERS[6] },
  { id: "t8",  title: "Quiet Riot",       artist: "Karim K",         artwork: COVERS[7] },
  { id: "t9",  title: "Cassette Heart",   artist: "Lina Mareau",     artwork: COVERS[8] },
  { id: "t10", title: "Midnight Index",   artist: "The Bevels",      artwork: COVERS[9] },
  { id: "t11", title: "Lowlight",         artist: "Maya Otero",      artwork: COVERS[10] },
  { id: "t12", title: "Old Habits",       artist: "Ahmed N.",        artwork: COVERS[11] },
  { id: "t13", title: "Half Moon Drive",  artist: "Jenny Park",      artwork: COVERS[12] },
  { id: "t14", title: "Static Bloom",     artist: "Linda Sole",      artwork: COVERS[13] },
  { id: "t15", title: "Echoes of June",   artist: "Lina Mareau",     artwork: COVERS[14] },
];

export const trackById = (id: string): Track | undefined =>
  sampleTracks.find((t) => t.id === id);

// ----------------------- Default seeded chart ------------------------------
// Current and previous Top 10 for the viewer; used to compute movement deltas.
// Differences vs previous show: t2 jumped, t10 is new, t5 dropped.
export const seededCurrentTop10: string[] = [
  "t1", "t2", "t4", "t10", "t6", "t5", "t8", "t9", "t13", "t15",
];

export const seededPreviousTop10: string[] = [
  "t1", "t5", "t4", "t2", "t6", "t9", "t8", "t13", "t15", "t12",
];

// "Last re-ranked" — 5 days ago so the 2-day refresh banner shows but no nag yet.
export const seededLastRankedAt: number =
  Date.now() - 5 * 24 * 60 * 60 * 1000;

// ----------------------- Friends with their charts -------------------------
export const friendCharts: FriendChart[] = [
  {
    id: "f-maya",
    username: "maya",
    displayName: "Maya Otero",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
    top10Ids: ["t4", "t1", "t11", "t2", "t6", "t9", "t13", "t7", "t10", "t3"],
  },
  {
    id: "f-karim",
    username: "karim_k",
    displayName: "Karim K",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
    top10Ids: ["t2", "t8", "t1", "t10", "t12", "t5", "t14", "t6", "t9", "t3"],
  },
  {
    id: "f-lina",
    username: "lina",
    displayName: "Lina Mareau",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
    top10Ids: ["t1", "t9", "t15", "t4", "t11", "t7", "t6", "t13", "t10", "t12"],
  },
  {
    id: "f-jenny",
    username: "jenny_p",
    displayName: "Jenny Park",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop",
    top10Ids: ["t6", "t13", "t3", "t14", "t7", "t11", "t1", "t8", "t2", "t12"],
  },
  {
    id: "f-ahmed",
    username: "ahmed_n",
    displayName: "Ahmed N.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    top10Ids: ["t5", "t12", "t14", "t8", "t3", "t7", "t2", "t10", "t11", "t1"],
  },
  {
    id: "f-linda",
    username: "linda",
    displayName: "Linda Sole",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop",
    top10Ids: ["t7", "t14", "t6", "t13", "t11", "t4", "t1", "t9", "t3", "t15"],
  },
];

// ----------------------- Global aggregate chart ----------------------------
// Pre-aggregated for display. Ordered list of trackIds w/ stats. Movement
// values are static; "voted by" is a display fiction.
export const globalChart: GlobalChartEntry[] = [
  { trackId: "t1",  points: 9820, appearances: 12400, voters: 12400, movement:  2 },
  { trackId: "t2",  points: 8740, appearances: 11050, voters: 11050, movement:  1 },
  { trackId: "t6",  points: 7610, appearances:  9870, voters:  9870, movement: -1 },
  { trackId: "t4",  points: 7120, appearances:  9220, voters:  9220, movement:  3 },
  { trackId: "t10", points: 6480, appearances:  8350, voters:  8350, movement:  0, isNew: true },
  { trackId: "t9",  points: 6210, appearances:  7990, voters:  7990, movement: -2 },
  { trackId: "t13", points: 5890, appearances:  7510, voters:  7510, movement:  4 },
  { trackId: "t8",  points: 5430, appearances:  7020, voters:  7020, movement: -3 },
  { trackId: "t7",  points: 5100, appearances:  6640, voters:  6640, movement:  0 },
  { trackId: "t14", points: 4720, appearances:  6210, voters:  6210, movement:  5 },
  { trackId: "t11", points: 4380, appearances:  5780, voters:  5780, movement: -1 },
  { trackId: "t3",  points: 4020, appearances:  5340, voters:  5340, movement:  0 },
];
