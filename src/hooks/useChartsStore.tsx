import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  seededCurrentTop10,
  seededPreviousTop10,
  seededLastRankedAt,
} from "@/data/mockCharts";

// ---------------------------------------------------------------------------
// Charts store — client-side only (localStorage persisted).
// Holds the viewer's current Top 10, previous Top 10 (for weekly deltas) and
// the timestamp of the last manual re-rank.
// ---------------------------------------------------------------------------

export type Movement =
  | { kind: "up"; by: number }
  | { kind: "down"; by: number }
  | { kind: "same" }
  | { kind: "new" };

interface ChartsContextValue {
  currentTop10: string[];
  previousTop10: string[];
  lastRankedAt: number;
  /** Get the weekly movement for a trackId at its current rank. */
  movementFor: (trackId: string) => Movement;
  /** Replace the current order. Saves previous = old current, stamps lastRankedAt. */
  reRank: (nextOrder: string[]) => void;
  /** True when ≥ 7 days have passed since lastRankedAt. */
  needsReRank: boolean;
  /** Days remaining until the next weekly refresh (0-7). */
  daysUntilRefresh: number;
}

const STORAGE_KEY = "wotcher.charts.v1";

const ChartsContext = createContext<ChartsContextValue | undefined>(undefined);

interface Persisted {
  current: string[];
  previous: string[];
  lastRankedAt: number;
}

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (Array.isArray(p.current) && Array.isArray(p.previous)) return p;
    }
  } catch {/* ignore */}
  return {
    current: seededCurrentTop10,
    previous: seededPreviousTop10,
    lastRankedAt: seededLastRankedAt,
  };
};

export const ChartsProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<Persisted>(() => loadPersisted());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state]);

  const value = useMemo<ChartsContextValue>(() => {
    const { current, previous, lastRankedAt } = state;

    const movementFor = (trackId: string): Movement => {
      const newIdx = current.indexOf(trackId);
      const oldIdx = previous.indexOf(trackId);
      if (newIdx < 0) return { kind: "same" };
      if (oldIdx < 0) return { kind: "new" };
      const delta = oldIdx - newIdx; // positive = moved up
      if (delta === 0) return { kind: "same" };
      if (delta > 0) return { kind: "up", by: delta };
      return { kind: "down", by: -delta };
    };

    const reRank = (nextOrder: string[]) => {
      setState((s) => ({
        current: nextOrder,
        previous: s.current,
        lastRankedAt: Date.now(),
      }));
    };

    const ageMs = Date.now() - lastRankedAt;
    const dayMs = 24 * 60 * 60 * 1000;
    const needsReRank = ageMs >= 7 * dayMs;
    const daysUntilRefresh = Math.max(0, Math.ceil((7 * dayMs - ageMs) / dayMs));

    return { currentTop10: current, previousTop10: previous, lastRankedAt, movementFor, reRank, needsReRank, daysUntilRefresh };
  }, [state]);

  return <ChartsContext.Provider value={value}>{children}</ChartsContext.Provider>;
};

export const useChartsStore = () => {
  const ctx = useContext(ChartsContext);
  if (!ctx) throw new Error("useChartsStore must be used within ChartsProvider");
  return ctx;
};

/** Net weekly movement summary across the whole Top 10 (sum of upward jumps). */
export const summarizeWeeklyMovement = (
  current: string[],
  previous: string[],
): { up: number; down: number; new: number } => {
  let up = 0, down = 0, n = 0;
  current.forEach((id, idx) => {
    const oldIdx = previous.indexOf(id);
    if (oldIdx < 0) { n += 1; return; }
    const delta = oldIdx - idx;
    if (delta > 0) up += delta;
    else if (delta < 0) down += -delta;
  });
  return { up, down, new: n };
};
