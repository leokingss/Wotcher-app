import { useEffect, useRef, useState } from "react";
import { Music2, Play, Pause, Pencil } from "lucide-react";
import { trackById } from "@/data/mockCharts";
import { useMusicMeta } from "@/hooks/useMusicMeta";
import { usePlayer } from "@/hooks/usePlayer";
import StrandWave from "@/components/StrandWave";
import TrackPickerSheet from "./TrackPickerSheet";

interface Props {
  listingId: string;
  isSeller: boolean;
  autoPlay?: boolean;  // true on listing detail open
}

/**
 * Phase 2 — "This shop's vibe": one track attached to a listing by the seller,
 * shown on feed listing bars and listing detail. autoPlay=true routes it to
 * the global mini-player on first mount (no real audio autoplays — the
 * StrandWave visualizer animates and the user can confirm playback).
 */
const VibeTrackBar = ({ listingId, isSeller, autoPlay = false }: Props) => {
  const { getVibe, setVibe } = useMusicMeta();
  const { track: nowPlaying, toggle, play } = usePlayer();
  const [pickerOpen, setPickerOpen] = useState(false);
  const autoPlayedRef = useRef(false);

  const vibeId = getVibe(listingId);
  const track = vibeId ? trackById(vibeId) : null;
  const isPlaying = !!track && nowPlaying?.id === track.id;

  useEffect(() => {
    if (!autoPlay || !track || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    play({ id: track.id, title: track.title, artist: track.artist, cover: track.artwork });
  }, [autoPlay, track, play]);

  if (!track) {
    if (!isSeller) return null;
    return (
      <>
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full neo-card-inset rounded-xl p-2.5 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Music2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold flex-1 text-left">Add this shop's vibe track</span>
          <span className="text-[11px] text-primary font-semibold">Pick</span>
        </button>
        <TrackPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(t) => setVibe(listingId, t.id)}
          title="Set this shop's vibe"
          description="Plays for buyers when they open your listing."
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full neo-card-inset rounded-xl p-2 flex items-center gap-2">
        <img src={track.artwork} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Shop's vibe</p>
          <p className="text-xs font-semibold truncate">{track.title} <span className="text-muted-foreground font-normal">· {track.artist}</span></p>
        </div>
        <div className="w-12 opacity-80">
          <StrandWave isPlaying={isPlaying} height={14} />
        </div>
        <button
          onClick={() => toggle({ id: track.id, title: track.title, artist: track.artist, cover: track.artwork })}
          className="neo-button-icon w-8 h-8 flex items-center justify-center shrink-0"
          aria-label={isPlaying ? "Pause vibe" : "Play vibe"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-primary" /> : <Play className="w-3.5 h-3.5 text-primary ml-0.5" />}
        </button>
        {isSeller && (
          <button
            onClick={() => setPickerOpen(true)}
            className="neo-button-icon w-7 h-7 flex items-center justify-center shrink-0"
            aria-label="Change vibe track"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      <TrackPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(t) => setVibe(listingId, t.id)}
        title="Change shop's vibe"
      />
    </>
  );
};

export default VibeTrackBar;
