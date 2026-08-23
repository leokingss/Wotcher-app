export interface Tap {
  /** normalized screen coords, -1..1 (x right, y up) */
  x: number;
  y: number;
  /** seconds into the chapter */
  at: number;
  /** "tap" pulses, "swipe" drags upward */
  kind?: "tap" | "swipe";
}

export interface Chapter {
  img: string;
  kicker: string;
  title: string;
  body: string;
  taps: Tap[];
}

const S = (n: string) => `/showcase/${n}.jpg`;

export const CHAPTERS: Chapter[] = [
  {
    img: S("02-feed"),
    kicker: "The Feed",
    title: "You choose the algorithm",
    body: "Live, Popular or For You — Wotcher always tells you which feed is in charge, and remembers your pick across devices.",
    taps: [
      { x: 0.3, y: 0.78, at: 1.1 },
      { x: -0.1, y: 0.1, at: 2.4, kind: "swipe" },
      { x: -0.55, y: -0.25, at: 3.6 },
    ],
  },
  {
    img: S("05-live"),
    kicker: "Live",
    title: "A wall of rooms, always on",
    body: "Auctions, listening parties and open hang-outs in a bento TV wall — with a radar map of who's broadcasting near you.",
    taps: [
      { x: -0.45, y: 0.35, at: 1.0 },
      { x: 0.45, y: -0.05, at: 2.6 },
    ],
  },
  {
    img: S("16-live-auction-room"),
    kicker: "Live Auctions",
    title: "Bid inside the stream",
    body: "Full-screen video, the top bid pinned above the controls, and the current bidder shown by name in real time.",
    taps: [
      { x: 0.5, y: -0.62, at: 1.2 },
      { x: 0.5, y: -0.62, at: 2.0 },
      { x: 0, y: -0.78, at: 3.2 },
    ],
  },
  {
    img: S("15-artist-profile"),
    kicker: "Artists",
    title: "Music that lives on the profile",
    body: "Morphing blob avatars, featured songs with the signature strand waveform, and a + to drop any track into your own Top 10.",
    taps: [
      { x: 0.62, y: 0.02, at: 1.3 },
      { x: -0.2, y: -0.3, at: 2.7, kind: "swipe" },
    ],
  },
  {
    img: S("04-charts"),
    kicker: "Charts",
    title: "Rank it, then predict it",
    body: "Community charts you can re-rank yourself, movement badges, and a predict game scored against next week's real positions.",
    taps: [
      { x: -0.3, y: 0.62, at: 1.0 },
      { x: 0.35, y: -0.1, at: 2.4 },
    ],
  },
  {
    img: S("03-search"),
    kicker: "Discovery",
    title: "Filters that actually filter",
    body: "Live, auctions, music and people in one search, with active-filter chips you can strip off one tap at a time.",
    taps: [
      { x: 0, y: 0.72, at: 1.0 },
      { x: -0.5, y: 0.45, at: 2.2 },
      { x: 0.2, y: -0.2, at: 3.4, kind: "swipe" },
    ],
  },
  {
    img: S("10-wallet"),
    kicker: "Wallet",
    title: "Tips, drops and red packets",
    body: "Send a tip mid-stream, claim a drop, or split a red packet with your circle — all settled inside the app.",
    taps: [
      { x: 0.4, y: 0.3, at: 1.2 },
      { x: 0, y: -0.4, at: 2.6 },
    ],
  },
  {
    img: S("09-profile"),
    kicker: "Your Space",
    title: "Circles, stories, highlights",
    body: "Private, family, friends or groups — every story is scoped to a circle, and the best ones outlive the 24 hours as highlights.",
    taps: [
      { x: -0.55, y: 0.55, at: 1.1 },
      { x: 0.1, y: -0.05, at: 2.5, kind: "swipe" },
      { x: 0.45, y: 0.2, at: 3.7 },
    ],
  },
];

export const CHAPTER_SECONDS = 5;
