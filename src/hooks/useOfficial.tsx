import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Broadcast, OFFICIAL_ACCOUNTS, OfficialAccount, seededBroadcasts } from "@/data/mockPhase5";

const KEY = "wotcher.official.v1";

interface Shape {
  broadcasts: Broadcast[];
}

interface Ctx {
  isOfficial: (username?: string | null) => boolean;
  getOfficial: (username?: string | null) => OfficialAccount | undefined;
  broadcasts: Broadcast[];
  broadcastsFor: (username: string) => Broadcast[];
  postBroadcast: (b: Omit<Broadcast, "id" | "at">) => void;
}

const C = createContext<Ctx | undefined>(undefined);

export const OfficialProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<Shape>(() => {
    if (typeof window === "undefined") return { broadcasts: seededBroadcasts };
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { broadcasts: seededBroadcasts };
      const parsed = JSON.parse(raw) as Shape;
      return { broadcasts: parsed.broadcasts?.length ? parsed.broadcasts : seededBroadcasts };
    } catch {
      return { broadcasts: seededBroadcasts };
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const isOfficial = useCallback((u?: string | null) => !!u && !!OFFICIAL_ACCOUNTS[u], []);
  const getOfficial = useCallback((u?: string | null) => (u ? OFFICIAL_ACCOUNTS[u] : undefined), []);
  const broadcastsFor = useCallback((u: string) => state.broadcasts.filter((b) => b.from === u), [state.broadcasts]);

  const postBroadcast = useCallback((b: Omit<Broadcast, "id" | "at">) => {
    setState((s) => ({ broadcasts: [{ ...b, id: Math.random().toString(36).slice(2, 9), at: Date.now() }, ...s.broadcasts] }));
  }, []);

  const value = useMemo<Ctx>(() => ({
    isOfficial, getOfficial, broadcasts: state.broadcasts, broadcastsFor, postBroadcast,
  }), [isOfficial, getOfficial, state.broadcasts, broadcastsFor, postBroadcast]);

  return <C.Provider value={value}>{children}</C.Provider>;
};

export const useOfficial = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useOfficial must be used inside OfficialProvider");
  return ctx;
};
