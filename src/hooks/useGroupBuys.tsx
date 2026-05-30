import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { GroupBuy, seededGroupBuys } from "@/data/mockPhase5";

const KEY = "wotcher.groupbuys.v1";

interface Ctx {
  groupBuys: GroupBuy[];
  byListing: (listingId: string) => GroupBuy | undefined;
  byId: (id: string) => GroupBuy | undefined;
  join: (id: string, username: string) => GroupBuy | null;
}

const C = createContext<Ctx | undefined>(undefined);

export const GroupBuysProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<GroupBuy[]>(() => {
    if (typeof window === "undefined") return seededGroupBuys;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seededGroupBuys;
      const parsed = JSON.parse(raw) as GroupBuy[];
      return parsed?.length ? parsed : seededGroupBuys;
    } catch { return seededGroupBuys; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  }, [list]);

  // Mark expired
  useEffect(() => {
    const t = setInterval(() => {
      setList((prev) => prev.map((g) => {
        if (g.status !== "open") return g;
        if (g.members.length >= g.required) return { ...g, status: "succeeded" };
        if (Date.now() > g.endsAt) return { ...g, status: "expired" };
        return g;
      }));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const join = useCallback((id: string, username: string): GroupBuy | null => {
    let updated: GroupBuy | null = null;
    setList((prev) => prev.map((g) => {
      if (g.id !== id || g.status !== "open") return g;
      if (g.members.some((m) => m.username === username)) { updated = g; return g; }
      const members = [...g.members, { username, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`, at: Date.now() }];
      const status = members.length >= g.required ? "succeeded" as const : "open" as const;
      updated = { ...g, members, status };
      return updated;
    }));
    return updated;
  }, []);

  const value = useMemo<Ctx>(() => ({
    groupBuys: list,
    byListing: (lid) => list.find((g) => g.listingId === lid),
    byId: (id) => list.find((g) => g.id === id),
    join,
  }), [list, join]);

  return <C.Provider value={value}>{children}</C.Provider>;
};

export const useGroupBuys = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useGroupBuys must be used inside GroupBuysProvider");
  return ctx;
};
