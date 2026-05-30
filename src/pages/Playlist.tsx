import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Play, Pause, Music2 } from "lucide-react";
import { useMusicMeta } from "@/hooks/useMusicMeta";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/hooks/usePlayer";
import { trackById } from "@/data/mockCharts";
import TrackPickerSheet from "@/components/music/TrackPickerSheet";
import StrandWave from "@/components/StrandWave";
import { toast } from "sonner";

const formatRelative = (ts: number) => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const Playlist = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlaylist, addToPlaylist } = useMusicMeta();
  const { profile } = useAuth();
  const { track: nowPlaying, toggle } = usePlayer();
  const [pickerOpen, setPickerOpen] = useState(false);

  const playlist = id ? getPlaylist(id) : undefined;

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <Music2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Playlist not found.</p>
          <button onClick={() => navigate("/charts")} className="action-button action-button-primary">Back to Charts</button>
        </div>
      </div>
    );
  }

  const onAdd = (t: { id: string }) => {
    const uname = profile?.username ?? "you";
    addToPlaylist(playlist.id, t.id, {
      id: profile?.id ?? "guest",
      username: uname,
      avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${uname}`,
    });
    toast.success("Track added to playlist");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold flex-1">Community Playlist</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <header className="neo-card p-4 rounded-2xl flex items-center gap-3">
          <img src={playlist.cover} alt={playlist.title} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{playlist.title}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{playlist.subtitle}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {playlist.contributors.slice(0, 5).map((c) => (
                  <img
                    key={c.id}
                    src={c.avatar}
                    alt={c.username}
                    className="w-6 h-6 rounded-full object-cover border-2 border-background"
                  />
                ))}
                {playlist.contributors.length > 5 && (
                  <span className="w-6 h-6 rounded-full bg-muted text-[9px] font-bold flex items-center justify-center border-2 border-background">
                    +{playlist.contributors.length - 5}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {playlist.contributors.length} contributors · {playlist.entries.length} tracks
              </span>
            </div>
          </div>
        </header>

        <button
          onClick={() => setPickerOpen(true)}
          className="w-full action-button action-button-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add a track
        </button>

        <div className="space-y-2">
          {playlist.entries.map((entry, idx) => {
            const t = trackById(entry.trackId);
            if (!t) return null;
            const playing = nowPlaying?.id === t.id;
            return (
              <div key={`${entry.trackId}-${idx}`} className="neo-card px-3 py-2.5 rounded-xl flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground/70 tabular-nums w-5 text-center shrink-0">
                  {idx + 1}
                </span>
                <img src={t.artwork} alt={t.title} className="w-11 h-11 rounded-md object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    added by @{entry.addedBy} · {formatRelative(entry.at)}
                  </p>
                </div>
                {playing && <div className="w-10 opacity-80"><StrandWave isPlaying height={14} /></div>}
                <button
                  onClick={() => toggle({ id: t.id, title: t.title, artist: t.artist, cover: t.artwork })}
                  className="neo-button-icon w-9 h-9 flex items-center justify-center shrink-0"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <TrackPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onAdd}
        title={`Add to ${playlist.title}`}
        description="Anyone in the group can contribute."
      />
    </div>
  );
};

export default Playlist;
