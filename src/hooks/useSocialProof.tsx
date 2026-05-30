import { useEffect, useState } from "react";

export interface SocialProof {
  watching: number;
  bidding: number;
  soldToday: number;
  recentBuyers: { username: string; avatar: string }[];
}

const seedFor = (id: string): SocialProof => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r = (m: number) => (h = (h * 1103515245 + 12345) >>> 0) % m;
  const watching = 8 + r(40);
  const bidding = 1 + r(Math.max(2, Math.floor(watching / 4)));
  const soldToday = r(6);
  const names = ["maya", "karim_k", "lina", "jenny_p", "ahmed_n", "linda", "noah", "ren"];
  const recentBuyers = Array.from({ length: 3 }, (_, i) => {
    const n = names[(r(names.length))];
    return { username: n, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${n}-${i}` };
  });
  return { watching, bidding, soldToday, recentBuyers };
};

export function useSocialProof(listingId: string): SocialProof {
  const [s, setS] = useState<SocialProof>(() => seedFor(listingId));

  useEffect(() => {
    setS(seedFor(listingId));
    const t = setInterval(() => {
      setS((prev) => {
        const drift = (cur: number, min: number, max: number) => {
          const d = Math.random() < 0.5 ? -1 : 1;
          const next = cur + (Math.random() < 0.4 ? d : 0);
          return Math.max(min, Math.min(max, next));
        };
        return {
          ...prev,
          watching: drift(prev.watching, 5, 250),
          bidding: drift(prev.bidding, 0, Math.max(2, Math.floor(prev.watching / 3))),
          soldToday: prev.soldToday + (Math.random() < 0.05 ? 1 : 0),
        };
      });
    }, 3500);
    return () => clearInterval(t);
  }, [listingId]);

  return s;
}
