import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Flame, Trophy, Sparkles, Check, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { globalChart, trackById } from "@/data/mockCharts";
import { usePredictStore, mockLeaderboard } from "@/hooks/usePredictStore";
import { useAuth } from "@/hooks/useAuth";

const PredictTab = () => {
  const { profile } = useAuth();
  const username = profile?.display_name || profile?.username || "You";
  const avatar = profile?.avatar_url || "https://i.pravatar.cc/80?img=1";
  const { state, setPrediction, clearPrediction, submitWeek, resolveNow, locked } = usePredictStore();
  const [view, setView] = useState<"predict" | "leaderboard">("predict");

  const predMap = useMemo(() => {
    const m = new Map<string, "up" | "down">();
    state.pending.forEach((p) => m.set(p.trackId, p.dir));
    return m;
  }, [state.pending]);

  const handleSubmit = () => {
    if (state.pending.length < 3) {
      toast.error("Pick at least 3 predictions");
      return;
    }
    submitWeek();
    toast.success(`Locked in ${state.pending.length} predictions`);
  };

  const handleResolve = () => {
    const r = resolveNow();
    if (r) toast.success(`Got ${r.correctCount}/${r.predictions.length} right · +${r.pointsAwarded} pts`);
  };

  const leaderboard = useMemo(() => {
    const me = { id: "me", name: username, avatar, points: state.points, streak: state.streak, isMe: true };
    return [...mockLeaderboard, me].sort((a, b) => b.points - a.points);
  }, [state.points, state.streak, username, avatar]);

  const lastWeek = state.history[0];

  return (
    <div className="space-y-4">
      {/* Stats hero */}
      <header className="neo-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Chart Predictions</p>
            <h2 className="text-lg font-bold">Call the next moves</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="neo-card-inset rounded-xl p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
            <p className="text-lg font-black text-primary">{state.points}</p>
          </div>
          <div className="neo-card-inset rounded-xl p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
            <p className="text-lg font-black flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />{state.streak}
            </p>
          </div>
          <div className="neo-card-inset rounded-xl p-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</p>
            <p className="text-lg font-black">{state.bestStreak}</p>
          </div>
        </div>
      </header>

      {/* sub-tabs */}
      <div className="neo-card-inset p-1 rounded-full flex gap-1">
        {([
          { id: "predict", label: "Make picks" },
          { id: "leaderboard", label: "Leaderboard" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all ${
              view === t.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "predict" && (
        <>
          {/* Last week recap */}
          {lastWeek && (
            <div className="neo-card p-3 rounded-2xl border border-primary/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Last week's results</p>
                <p className="text-xs text-primary font-bold">+{lastWeek.pointsAwarded} pts</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lastWeek.correctCount}/{lastWeek.predictions.length} correct calls
              </p>
            </div>
          )}

          {locked ? (
            <div className="neo-card p-4 rounded-2xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Predictions locked in</p>
                <p className="text-[11px] text-muted-foreground">Resolves next chart refresh.</p>
              </div>
              <button onClick={handleResolve} className="text-xs font-semibold text-primary px-3 py-1.5 neo-button rounded-lg">
                Simulate
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                <span className="text-primary font-bold">{state.pending.length}</span> of 10 picks
              </span>
              <span>+{POINTS_HINT} pts per correct call</span>
            </div>
          )}

          {/* Tracks */}
          <div className="space-y-2">
            {globalChart.map((entry, idx) => {
              const t = trackById(entry.trackId);
              if (!t) return null;
              const pick = predMap.get(entry.trackId);
              return (
                <div key={entry.trackId} className="neo-card p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-base font-black tabular-nums w-5 text-center shrink-0 text-muted-foreground/70">
                    {idx + 1}
                  </span>
                  <img src={t.artwork} alt={t.title} className="w-10 h-10 rounded-md object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.artist}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      disabled={locked}
                      onClick={() => (pick === "up" ? clearPrediction(entry.trackId) : setPrediction(entry.trackId, "up"))}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        pick === "up"
                          ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-400/60"
                          : "neo-button text-muted-foreground"
                      } ${locked ? "opacity-40" : ""}`}
                      aria-label="Predict rise"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={locked}
                      onClick={() => (pick === "down" ? clearPrediction(entry.trackId) : setPrediction(entry.trackId, "down"))}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        pick === "down"
                          ? "bg-red-500/20 text-red-400 ring-2 ring-red-400/60"
                          : "neo-button text-muted-foreground"
                      } ${locked ? "opacity-40" : ""}`}
                      aria-label="Predict fall"
                    >
                      <TrendingDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!locked && (
            <button
              onClick={handleSubmit}
              disabled={state.pending.length < 3}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Lock in {state.pending.length} predictions
            </button>
          )}

          {/* Last week per-track breakdown */}
          {lastWeek && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Last week recap</p>
              {lastWeek.predictions.map((p) => {
                const t = trackById(p.trackId);
                if (!t) return null;
                const actual = lastWeek.results[p.trackId];
                const correct = actual === p.dir;
                return (
                  <div key={p.trackId} className="neo-card p-2.5 rounded-xl flex items-center gap-3">
                    <img src={t.artwork} alt={t.title} className="w-9 h-9 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        You: {p.dir === "up" ? "▲" : "▼"} · Actual: {actual === "up" ? "▲" : "▼"}
                      </p>
                    </div>
                    {correct ? (
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === "leaderboard" && (
        <div className="space-y-2">
          <div className="neo-card p-3 rounded-2xl flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold flex-1">Weekly predictors</p>
            <p className="text-[10px] text-muted-foreground">Resets weekly</p>
          </div>
          {leaderboard.map((row, idx) => (
            <div
              key={row.id}
              className={`neo-card p-3 rounded-xl flex items-center gap-3 ${
                (row as any).isMe ? "ring-1 ring-primary/50" : ""
              }`}
            >
              <span className={`text-base font-black tabular-nums w-6 text-center shrink-0 ${
                idx === 0 ? "text-primary" : idx < 3 ? "text-foreground/80" : "text-muted-foreground/60"
              }`}>
                {idx + 1}
              </span>
              <img src={row.avatar} alt={row.name} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {row.name}{(row as any).isMe ? " (you)" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />{row.streak} week streak
                </p>
              </div>
              <p className="text-sm font-black text-primary">{row.points}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const POINTS_HINT = 10;

export default PredictTab;
