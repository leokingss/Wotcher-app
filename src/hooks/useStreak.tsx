import { useEffect, useState } from "react";

const KEY = "wotcher.streak.v1";

interface Shape { count: number; lastDay: string }

const today = () => new Date().toISOString().slice(0, 10);
const yest = () => {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
};

const load = (): Shape => {
  if (typeof window === "undefined") return { count: 1, lastDay: today() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 1, lastDay: today() };
    return JSON.parse(raw) as Shape;
  } catch { return { count: 1, lastDay: today() }; }
};

export function useStreak() {
  const [state, setState] = useState<Shape>(() => load());

  useEffect(() => {
    const t = today();
    setState((s) => {
      if (s.lastDay === t) return s;
      const next = s.lastDay === yest() ? { count: s.count + 1, lastDay: t } : { count: 1, lastDay: t };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return state.count;
}
