// ---------------------------------------------------------------------------
// Phase 4 — Wallet, tipping, paid drops, red packets seed data.
// All client-side; persisted via useWallet (localStorage).
// ---------------------------------------------------------------------------

import { sampleTracks } from "./mockCharts";

export type TxKind =
  | "topup"
  | "tip-out"
  | "tip-in"
  | "bid"
  | "bid-refund"
  | "purchase"
  | "drop-buy"
  | "packet-grab"
  | "p2p-out"
  | "p2p-in";

export interface WalletTx {
  id: string;
  kind: TxKind;
  amount: number;          // signed in £ (negative = debit)
  at: number;              // ms epoch
  label: string;           // e.g. "Tip to @maya"
  meta?: Record<string, any>;
}

export type DropAccess = "free" | "paid" | "followers-first";

export interface Drop {
  id: string;
  creator: string;
  creatorAvatar: string;
  title: string;
  cover: string;
  access: DropAccess;
  price?: number;          // £, for "paid"
  publicAt?: number;       // ms epoch; for "followers-first"
  trackId?: string;        // bonus content
  description: string;
}

export interface RedPacketShare {
  amount: number;
  trackId?: string;        // if non-null, the share is a track instead of cash
  claimedBy?: string;      // username when grabbed
  at?: number;
}

export interface RedPacket {
  id: string;
  creator: string;
  creatorAvatar: string;
  greeting: string;
  pool: number;            // total £ (sum of cash shares)
  shares: RedPacketShare[];
  createdAt: number;
}

const now = Date.now();

export const seededDrops: Drop[] = [
  {
    id: "drop-1",
    creator: "maya",
    creatorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Maya",
    title: "Slow Motion · Acoustic Cut",
    cover: sampleTracks[3].artwork,
    access: "followers-first",
    publicAt: now + 1000 * 60 * 60 * 23, // 23h
    trackId: "t4",
    description: "Followers get the acoustic version 24h before public.",
  },
  {
    id: "drop-2",
    creator: "karim_k",
    creatorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Karim",
    title: "Sandlight · Deluxe Pack",
    cover: sampleTracks[1].artwork,
    access: "paid",
    price: 4,
    trackId: "t2",
    description: "Stems, lyric sheet, and a signed print.",
  },
  {
    id: "drop-3",
    creator: "lina",
    creatorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Lina",
    title: "Velvet Hours · Free Single",
    cover: sampleTracks[0].artwork,
    access: "free",
    trackId: "t1",
    description: "Out for everyone. Tip if it hits.",
  },
];

const splitPool = (pool: number, n: number): number[] => {
  // random split that sums to pool, each share >= 0.20
  const weights = Array.from({ length: n }, () => Math.random() + 0.2);
  const sum = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => +(((w / sum) * pool)).toFixed(2));
  // fix rounding drift on last
  const drift = +(pool - shares.reduce((a, b) => a + b, 0)).toFixed(2);
  shares[shares.length - 1] = +(shares[shares.length - 1] + drift).toFixed(2);
  return shares.sort(() => Math.random() - 0.5);
};

export const seededPackets: RedPacket[] = [
  {
    id: "packet-1",
    creator: "ahmed_n",
    creatorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ahmed",
    greeting: "Thanks for 10k — grab one ✨",
    pool: 20,
    shares: splitPool(20, 8).map((amount) => ({ amount })),
    createdAt: now - 1000 * 60 * 12,
  },
  {
    id: "packet-2",
    creator: "the_bevels",
    creatorAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Bevels",
    greeting: "Album-week red packet 🎁",
    pool: 12,
    shares: [
      ...splitPool(12, 5).map((amount) => ({ amount })),
      { amount: 0, trackId: "t10" }, // one share is a bonus track
    ],
    createdAt: now - 1000 * 60 * 60 * 2,
  },
];

export const STARTING_BALANCE = 50;
