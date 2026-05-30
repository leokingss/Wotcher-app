// Mock data for the Live Auctions / Live Lens (Phase 3).
// Client-side only — used by /live and /live/:id.

export type LiveKind = "auction" | "sync" | "together";

export interface LiveItem {
  id: string;
  title: string;
  image: string;
  startingBid: number;
  topBid: number;
  topBidderId?: string;
}

export interface LiveRoom {
  id: string;
  kind: LiveKind;
  title: string;
  host: { id: string; name: string; avatar: string; verified?: boolean };
  cover: string;
  viewers: number;
  bidders: number;
  endsAt: string; // ISO
  item?: LiveItem; // present for auctions
  bidders_avatars: string[];
}

const AV = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const COVERS = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&h=1200&fit=crop",
];

const ITEMS = [
  "https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1535992165812-68d1861aa71e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1593697821028-7cc59cfd7399?w=600&h=600&fit=crop",
];

export const mockLiveRooms: LiveRoom[] = [
  {
    id: "live-1",
    kind: "auction",
    title: "Rare press: Blue Note first edition",
    host: { id: "maya", name: "Maya Vinyl", avatar: AV("maya"), verified: true },
    cover: COVERS[0],
    viewers: 1247,
    bidders: 18,
    endsAt: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
    item: {
      id: "item-1",
      title: "Blue Note 1568 — Lee Morgan",
      image: ITEMS[0],
      startingBid: 25,
      topBid: 145,
      topBidderId: "bidder-3",
    },
    bidders_avatars: ["jay", "ola", "kim", "sam", "lex", "rio"].map(AV),
  },
  {
    id: "live-2",
    kind: "auction",
    title: "Pristine cassette lot — 80s synthpop",
    host: { id: "drew", name: "Drew Records", avatar: AV("drew") },
    cover: COVERS[1],
    viewers: 412,
    bidders: 9,
    endsAt: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    item: {
      id: "item-2",
      title: "Tape lot of 12 (Yaz, OMD, NewOrder)",
      image: ITEMS[1],
      startingBid: 10,
      topBid: 38,
    },
    bidders_avatars: ["aya", "bek", "cy", "dee"].map(AV),
  },
  {
    id: "live-3",
    kind: "sync",
    title: "Friday Sync — Lo-fi rooftop",
    host: { id: "nori", name: "Nori", avatar: AV("nori") },
    cover: COVERS[2],
    viewers: 286,
    bidders: 0,
    endsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    bidders_avatars: [],
  },
  {
    id: "live-4",
    kind: "together",
    title: "Live Together: Pink Floyd — DSOTM",
    host: { id: "iris", name: "Iris", avatar: AV("iris") },
    cover: COVERS[3],
    viewers: 98,
    bidders: 0,
    endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    bidders_avatars: [],
  },
];

export const sampleChatLines = [
  "FIRE 🔥",
  "shipping to UK?",
  "condition?",
  "let's gooo",
  "rare!",
  "in for the next one",
  "💛💛💛",
  "love this seller",
  "vinyl heads where u at",
  "i need this",
];

export const sampleBidderNames = [
  "vinylvibes", "soulseeker", "tapehead", "bassface",
  "groovekid", "lofilover", "wax_dynasty", "midnightDJ",
];
