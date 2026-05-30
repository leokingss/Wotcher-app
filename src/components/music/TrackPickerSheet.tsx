import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { sampleTracks, Track } from "@/data/mockCharts";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (track: Track) => void;
  title?: string;
  description?: string;
}

/**
 * Phase 2 — shared track-picker modal used by Profile anthem, audio reactions,
 * seller vibe and community playlists. Reuses the Phase 1 sampleTracks library.
 */
const TrackPickerSheet = ({ open, onClose, onPick, title = "Pick a track", description }: Props) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return sampleTracks;
    const needle = q.toLowerCase();
    return sampleTracks.filter(
      (t) => t.title.toLowerCase().includes(needle) || t.artist.toLowerCase().includes(needle),
    );
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md neo-card rounded-t-3xl sm:rounded-3xl p-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="neo-button-icon p-2 shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center neo-card-inset rounded-xl px-3 py-2 gap-2 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks or artists"
            className="flex-1 bg-transparent outline-none text-sm"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto -mx-1 px-1 flex-1 space-y-1.5">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => { onPick(t); onClose(); }}
              className="w-full flex items-center gap-3 p-2 rounded-xl neo-button text-left hover:bg-foreground/[0.03]"
            >
              <img src={t.artwork} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No tracks found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackPickerSheet;
