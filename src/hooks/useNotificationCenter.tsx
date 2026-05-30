import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useChartsStore } from "./useChartsStore";

export type NotifKind = "live" | "drop" | "packet" | "rerank" | "broadcast" | "groupbuy";

export interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  body?: string;
  at: number;
  href?: string;
  read?: boolean;
}

interface Ctx {
  notifs: Notif[];
  unread: number;
  push: (n: Omit<Notif, "id" | "at" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
}

const C = createContext<Ctx | undefined>(undefined);

const KEY = "wotcher.notifs.v1";

const seed: Notif[] = [
  { id: "n1", kind: "live", title: "karim_k is live now", body: "Sandlight Q&A", href: "/live", at: Date.now() - 1000 * 60 * 4 },
  { id: "n2", kind: "drop", title: "New drop from maya", body: "Slow Motion · Acoustic Cut", href: "/wallet", at: Date.now() - 1000 * 60 * 25 },
  { id: "n3", kind: "packet", title: "Red packet dropped 🧧", body: "Grab a share before it's gone", href: "/wallet", at: Date.now() - 1000 * 60 * 90 },
  { id: "n4", kind: "broadcast", title: "jenny_p · Studio shop restock", body: "Sunday 10am · £5 off for followers", at: Date.now() - 1000 * 60 * 60 * 3 },
];

export const NotificationCenterProvider = ({ children }: { children: ReactNode }) => {
  const [notifs, setNotifs] = useState<Notif[]>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed;
      const parsed = JSON.parse(raw) as Notif[];
      return parsed?.length ? parsed : seed;
    } catch { return seed; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(notifs.slice(0, 60))); } catch {}
  }, [notifs]);

  // Re-rank reminder
  const { lastRankedAt } = useChartsStore();
  useEffect(() => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastRankedAt < sevenDays) return;
    setNotifs((prev) => prev.some((n) => n.kind === "rerank")
      ? prev
      : [{ id: "rerank-auto", kind: "rerank", title: "Time to re-rank your Top 10", body: "It's been a week — what's moved up?", href: "/charts", at: Date.now() }, ...prev]);
  }, [lastRankedAt]);

  const push = useCallback((n: Omit<Notif, "id" | "at" | "read">) => {
    setNotifs((prev) => [{ ...n, id: Math.random().toString(36).slice(2, 9), at: Date.now() }, ...prev].slice(0, 60));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifs([]), []);

  const value = useMemo<Ctx>(() => ({
    notifs,
    unread: notifs.filter((n) => !n.read).length,
    push, markAllRead, clear,
  }), [notifs, push, markAllRead, clear]);

  return <C.Provider value={value}>{children}</C.Provider>;
};

export const useNotificationCenter = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useNotificationCenter must be used inside NotificationCenterProvider");
  return ctx;
};
