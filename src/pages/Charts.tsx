import { useMemo, useState } from "react";
import { Share2, Sparkles, Clock, ChevronRight, ListMusic } from "lucide-react";
import { Link } from "react-router-dom";
import { useMusicMeta } from "@/hooks/useMusicMeta";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useChartsStore, summarizeWeeklyMovement } from "@/hooks/useChartsStore";
import {
  sampleTracks,
  trackById,
  friendCharts,
  globalChart,
  FriendChart,
} from "@/data/mockCharts";
import ChartRow from "@/components/charts/ChartRow";
import MovementBadge from "@/components/charts/MovementBadge";
import ReRankSheet from "@/components/charts/ReRankSheet";
import PredictTab from "@/components/charts/PredictTab";

type Tab = "mine" | "friends" | "global" | "predict";

const formatRelative = (ts: number) => {
  const diffMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
};

const Charts = () => {
  const { profile } = useAuth();
  const username = profile?.display_name || profile?.username || "You";
  const { currentTop10, previousTop10, lastRankedAt, movementFor, reRank, needsReRank, daysUntilRefresh } = useChartsStore();
  const [tab, setTab] = useState<Tab>("mine");
  const [openSheet, setOpenSheet] = useState(false);
  const [viewingFriend, setViewingFriend] = useState<FriendChart | null>(null);
  const { playlists } = useMusicMeta();

  const myTracks = useMemo(
    () => currentTop10.map((id) => trackById(id)).filter(Boolean) as ReturnType<typeof trackById>[] as NonNullable<ReturnType<typeof trackById>>[],
    [currentTop10],
  );
  const summary = useMemo(() => summarizeWeeklyMovement(currentTop10, previousTop10), [currentTop10, previousTop10]);

  const handleShare = async () => {
    const text = `${username}'s Top 10 this week:\n` +
      myTracks.map((t, i) => `${i + 1}. ${t.title} — ${t.artist}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: `${username}'s Top 10`, text });
      else { await navigator.clipboard.writeText(text); toast.success("Chart copied to clipboard"); }
    } catch {/* user cancelled */}
  };

  const handleSave = (ids: string[]) => {
    reRank(ids);
    setOpenSheet(false);
    toast.success("Top 10 re-ranked");
  };

  const friendOverlaps = useMemo(() => {
    const mySet = new Set(currentTop10);
    return friendCharts
      .map((f) => ({
        friend: f,
        shared: f.top10Ids.filter((id) => mySet.has(id)),
      }))
      .sort((a, b) => b.shared.length - a.shared.length);
  }, [currentTop10]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
          <h1 className="text-xl font-bold mb-3">Charts</h1>
          <div className="neo-card-inset p-1 rounded-full flex gap-1">
            {([
              { id: "mine", label: "My Top 10" },
              { id: "friends", label: "Friends" },
              { id: "global", label: "Global" },
              { id: "predict", label: "Predict" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setViewingFriend(null); }}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all ${
                  tab === t.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Re-rank nag */}
        {needsReRank && tab === "mine" && (
          <div className="neo-card p-3 rounded-2xl flex items-center gap-3 border border-primary/30">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs flex-1">Time to re-rank your Top 10 — it's been a week.</p>
            <button onClick={() => setOpenSheet(true)} className="text-xs font-semibold text-primary px-2 py-1">
              Re-rank
            </button>
          </div>
        )}

        {/* Refresh countdown */}
        {!needsReRank && tab === "mine" && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Charts refresh in {daysUntilRefresh}d</span>
          </div>
        )}

        {/* MY TOP 10 */}
        {tab === "mine" && !viewingFriend && (
          <>
            <header className="neo-card p-4 rounded-2xl">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Personal Chart</p>
              <h2 className="text-xl font-bold mt-0.5">{username}'s Top 10</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {summary.up > 0 ? (
                  <span className="text-emerald-400 font-semibold">▲ Up {summary.up} this week</span>
                ) : summary.down > 0 ? (
                  <span className="text-red-400 font-semibold">▼ Down {summary.down} this week</span>
                ) : (
                  <span>No movement this week</span>
                )}
                <span>·</span>
                <span>Re-ranked {formatRelative(lastRankedAt)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setOpenSheet(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Re-rank
                </button>
                <button
                  onClick={handleShare}
                  className="neo-button flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share chart
                </button>
              </div>
            </header>

            <div className="space-y-2">
              {myTracks.map((track, idx) => (
                <ChartRow key={track.id} rank={idx + 1} track={track} movement={movementFor(track.id)} />
              ))}
            </div>
          </>
        )}

        {/* FRIENDS list */}
        {tab === "friends" && !viewingFriend && (
          <div className="space-y-2">
            {friendOverlaps.map(({ friend, shared }) => (
              <button
                key={friend.id}
                onClick={() => setViewingFriend(friend)}
                className="w-full neo-card p-3 rounded-2xl flex items-center gap-3 text-left transition-colors hover:bg-foreground/[0.02]"
              >
                <img src={friend.avatar} alt={friend.displayName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{friend.displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    You and {friend.displayName.split(" ")[0]} share{" "}
                    <span className="text-primary font-bold">{shared.length}</span> of 10
                  </p>
                  {shared.length > 0 && (
                    <div className="flex -space-x-2 mt-1.5">
                      {shared.slice(0, 5).map((id) => {
                        const t = trackById(id);
                        if (!t) return null;
                        return (
                          <img
                            key={id}
                            src={t.artwork}
                            alt={t.title}
                            className="w-6 h-6 rounded-md object-cover border border-background"
                          />
                        );
                      })}
                      {shared.length > 5 && (
                        <span className="w-6 h-6 rounded-md bg-muted text-[9px] font-bold flex items-center justify-center border border-background">
                          +{shared.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* FRIEND chart detail */}
        {tab === "friends" && viewingFriend && (
          <>
            <header className="neo-card p-4 rounded-2xl flex items-center gap-3">
              <img src={viewingFriend.avatar} alt={viewingFriend.displayName} className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Friend Chart</p>
                <h2 className="text-lg font-bold truncate">{viewingFriend.displayName}'s Top 10</h2>
                <p className="text-[11px] text-muted-foreground">@{viewingFriend.username}</p>
              </div>
              <button onClick={() => setViewingFriend(null)} className="text-xs text-primary font-semibold">
                Back
              </button>
            </header>
            <div className="space-y-2">
              {viewingFriend.top10Ids.map((id, idx) => {
                const t = trackById(id);
                if (!t) return null;
                const shared = currentTop10.includes(id);
                return (
                  <ChartRow
                    key={id}
                    rank={idx + 1}
                    track={t}
                    rightSlot={
                      shared ? (
                        <span className="text-[10px] font-bold text-primary tracking-wide px-1.5 py-0.5 rounded-md bg-primary/15">
                          SHARED
                        </span>
                      ) : null
                    }
                  />
                );
              })}
            </div>
          </>
        )}

        {/* GLOBAL */}
        {tab === "global" && (
          <>
            <header className="neo-card p-4 rounded-2xl">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Community Chart</p>
              <h2 className="text-xl font-bold mt-0.5">Global Top Tracks</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Aggregated from {formatCount(globalChart[0]?.voters ?? 0)}+ Top 10 charts this week
              </p>
            </header>

            {/* Community Playlists rail (Phase 2) */}
            {playlists.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
                    <ListMusic className="w-3 h-3" /> Community Playlists
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 py-2 scrollbar-none">
                  {playlists.map((p) => (
                    <Link
                      key={p.id}
                      to={`/playlists/${p.id}`}
                      className="shrink-0 w-44 neo-card p-2.5 rounded-2xl flex flex-col gap-2 hover:opacity-90 transition-opacity"
                    >
                      <img src={p.cover} alt={p.title} className="w-full aspect-square rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.subtitle}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex -space-x-1.5">
                            {p.contributors.slice(0, 3).map((c) => (
                              <img key={c.id} src={c.avatar} alt="" className="w-4 h-4 rounded-full object-cover border border-background" />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{p.entries.length} tracks</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <div className="space-y-2">
              {globalChart.map((entry, idx) => {
                const t = trackById(entry.trackId);
                if (!t) return null;
                const mv = entry.isNew
                  ? { kind: "new" as const }
                  : entry.movement === 0
                    ? { kind: "same" as const }
                    : entry.movement > 0
                      ? { kind: "up" as const, by: entry.movement }
                      : { kind: "down" as const, by: -entry.movement };
                return (
                  <div key={entry.trackId} className="neo-card px-3 py-2.5 rounded-xl flex items-center gap-3">
                    <span className={`text-2xl font-black tabular-nums w-7 text-center shrink-0 ${idx === 0 ? "text-primary" : idx < 3 ? "text-foreground/80" : "text-muted-foreground/60"}`}>
                      {idx + 1}
                    </span>
                    <img src={t.artwork} alt={t.title} className="w-11 h-11 rounded-md object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        voted by {formatCount(entry.voters)} charts · {formatCount(entry.points)} pts
                      </p>
                    </div>
                    <MovementBadge movement={mv} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "predict" && <PredictTab />}
      </div>

      {openSheet && (
        <ReRankSheet
          open={openSheet}
          initial={myTracks}
          onClose={() => setOpenSheet(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Charts;
