import { useState } from "react";
import { Play, Pause, Music2, Pencil } from "lucide-react";
import { trackById } from "@/data/mockCharts";
import { useMusicMeta } from "@/hooks/useMusicMeta";
import { usePlayer } from "@/hooks/usePlayer";
import StrandWave from "@/components/StrandWave";
import TrackPickerSheet from "./TrackPickerSheet";

interface Props {
  username: string;
  isOwn: boolean;
  displayName?: string;
}

/**
 * Profile Anthem — signature track shown under avatar / stats. Always shows
 * the signature StrandWave (the "muted preview") and offers a play button
 * to surface the full track through the global player.
 */
const AnthemBlock = ({ username, isOwn, displayName }: Props) => {
  const { getAnthem, setAnthem } = useMusicMeta();
  const { track: nowPlaying, toggle } = usePlayer();
  const [pickerOpen, setPickerOpen] = useState(false);

  const anthemId = getAnthem(username);
  const track = anthemId ? trackById(anthemId) : null;
  const isPlaying = !!track && nowPlaying?.id === track.id;

  if (!track) {
    if (!isOwn) return null;
    return (
      <>
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full max-w-sm mx-auto mb-4 neo-card-inset rounded-2xl p-3 flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="neo-button-icon w-11 h-11 flex items-center justify-center shrink-0">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Your Anthem</p>
            <p className="text-sm font-semibold">Pick a signature track</p>
          </div>
          <span className="text-xs font-semibold text-primary">Add</span>
        </button>
        <TrackPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(t) => setAnthem(username, t.id)}
          title="Pick your anthem"
          description="A signature track that plays under your stats."
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-sm mx-auto mb-4 neo-card-inset rounded-2xl p-3 flex items-center gap-3">
        <img src={track.artwork} alt={track.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {isOwn ? "Your Anthem" : `${displayName ?? username}'s Anthem`}
          </p>
          <p className="text-sm font-semibold truncate">{track.title}</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
            <div className="flex-1 min-w-[40px] max-w-[80px] opacity-80">
              <StrandWave isPlaying className="w-full" height={14} />
            </div>
          </div>
        </div>
        <button
          onClick={() => toggle({ id: track.id, title: track.title, artist: track.artist, cover: track.artwork })}
          className="neo-button-icon w-10 h-10 flex items-center justify-center shrink-0"
          aria-label={isPlaying ? "Pause anthem" : "Play anthem"}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
        </button>
        {isOwn && (
          <button
            onClick={() => setPickerOpen(true)}
            className="neo-button-icon w-8 h-8 flex items-center justify-center shrink-0"
            aria-label="Change anthem"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      <TrackPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(t) => setAnthem(username, t.id)}
        title="Change your anthem"
      />
    </>
  );
};

export default AnthemBlock;
