import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { globalChart } from "@/data/mockCharts";

export type PredictionDir = "up" | "down";

export interface Prediction {
  trackId: string;
  dir: PredictionDir;
  at: number;
}

export interface ResolvedWeek {
  weekId: string;        // e.g. "2026-W21"
  resolvedAt: number;
  predictions: Prediction[];
  results: Record<string, PredictionDir>; // trackId -> actual movement
  correctCount: number;
  pointsAwarded: number;
}

interface PredictState {
  currentWeekId: string;
  pending: Prediction[];        // current week, not yet resolved
  history: ResolvedWeek[];      // past weeks, newest first
  points: number;
  streak: number;               // consecutive weeks with >=1 correct
  bestStreak: number;
  submittedAt: number | null;   // when current week was locked in
}

const STORAGE_KEY = "lov:predict:v1";
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;

const currentWeekId = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((+now - +start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
};

const initialState: PredictState = {
  currentWeekId: currentWeekId(),
  pending: [],
  history: [],
  points: 0,
  streak: 0,
  bestStreak: 0,
  submittedAt: null,
};

const PredictContext = createContext<{
  state: PredictState;
  setPrediction: (trackId: string, dir: PredictionDir) => void;
  clearPrediction: (trackId: string) => void;
  submitWeek: () => void;
  resolveNow: () => ResolvedWeek | null; // simulate next-week resolution
  reset: () => void;
  locked: boolean;
} | null>(null);

export const PredictProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PredictState>(() => {
    if (typeof window === "undefined") return initialState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...initialState, ...JSON.parse(raw) };
    } catch {/* ignore */}
    return initialState;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* ignore */}
  }, [state]);

  const setPrediction = useCallback((trackId: string, dir: PredictionDir) => {
    setState((s) => {
      if (s.submittedAt) return s;
      const others = s.pending.filter((p) => p.trackId !== trackId);
      return { ...s, pending: [...others, { trackId, dir, at: Date.now() }] };
    });
  }, []);

  const clearPrediction = useCallback((trackId: string) => {
    setState((s) => {
      if (s.submittedAt) return s;
      return { ...s, pending: s.pending.filter((p) => p.trackId !== trackId) };
    });
  }, []);

  const submitWeek = useCallback(() => {
    setState((s) => (s.submittedAt ? s : { ...s, submittedAt: Date.now() }));
  }, []);

  const resolveNow = useCallback((): ResolvedWeek | null => {
    let resolved: ResolvedWeek | null = null;
    setState((s) => {
      if (!s.submittedAt || s.pending.length === 0) return s;
      // Mock the actual resolution: bias by current movement, but flip ~30% of the time
      const results: Record<string, PredictionDir> = {};
      s.pending.forEach((p) => {
        const entry = globalChart.find((g) => g.trackId === p.trackId);
        const baseUp = entry ? entry.movement >= 0 : Math.random() < 0.5;
        const flip = Math.random() < 0.3;
        results[p.trackId] = (baseUp ? "up" : "down") === (flip ? (Math.random() < 0.5 ? "up" : "down") : (baseUp ? "up" : "down"))
          ? (baseUp ? "up" : "down")
          : (baseUp ? "down" : "up");
      });
      let correct = 0;
      s.pending.forEach((p) => { if (results[p.trackId] === p.dir) correct++; });
      const newStreak = correct > 0 ? s.streak + 1 : 0;
      const bonus = correct > 0 ? newStreak * STREAK_BONUS : 0;
      const awarded = correct * POINTS_PER_CORRECT + bonus;
      resolved = {
        weekId: s.currentWeekId,
        resolvedAt: Date.now(),
        predictions: s.pending,
        results,
        correctCount: correct,
        pointsAwarded: awarded,
      };
      return {
        ...s,
        currentWeekId: currentWeekId() + "-r" + (s.history.length + 1),
        pending: [],
        submittedAt: null,
        history: [resolved, ...s.history],
        points: s.points + awarded,
        streak: newStreak,
        bestStreak: Math.max(s.bestStreak, newStreak),
      };
    });
    return resolved;
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo(() => ({
    state,
    setPrediction,
    clearPrediction,
    submitWeek,
    resolveNow,
    reset,
    locked: !!state.submittedAt,
  }), [state, setPrediction, clearPrediction, submitWeek, resolveNow, reset]);

  return <PredictContext.Provider value={value}>{children}</PredictContext.Provider>;
};

export const usePredictStore = () => {
  const ctx = useContext(PredictContext);
  if (!ctx) throw new Error("usePredictStore must be used within PredictProvider");
  return ctx;
};

// Mock leaderboard — user is inserted dynamically by the component.
export const mockLeaderboard = [
  { id: "lb1", name: "vinylvera",    avatar: "https://i.pravatar.cc/80?img=12", points: 412, streak: 6 },
  { id: "lb2", name: "loop_king",    avatar: "https://i.pravatar.cc/80?img=22", points: 388, streak: 4 },
  { id: "lb3", name: "maya",         avatar: "https://i.pravatar.cc/80?img=32", points: 351, streak: 3 },
  { id: "lb4", name: "karim_k",      avatar: "https://i.pravatar.cc/80?img=42", points: 297, streak: 2 },
  { id: "lb5", name: "bea.beats",    avatar: "https://i.pravatar.cc/80?img=5",  points: 264, streak: 5 },
  { id: "lb6", name: "echo.haus",    avatar: "https://i.pravatar.cc/80?img=15", points: 231, streak: 1 },
  { id: "lb7", name: "subzero_dj",   avatar: "https://i.pravatar.cc/80?img=25", points: 189, streak: 2 },
  { id: "lb8", name: "neon_nights",  avatar: "https://i.pravatar.cc/80?img=35", points: 142, streak: 0 },
];
