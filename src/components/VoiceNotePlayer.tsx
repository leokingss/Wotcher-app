import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface Props {
  src: string;
  durationSec?: number;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const VoiceNotePlayer = ({ src, durationSec }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [length, setLength] = useState(durationSec ?? 0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const bars = 24;
  const heights = Array.from({ length: bars }, (_, i) => 30 + ((i * 53) % 70));

  return (
    <div className="flex items-center gap-2 neo-card-inset px-3 py-2 rounded-full max-w-[260px]">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => !durationSec && setLength(e.currentTarget.duration || 0)}
        hidden
      />
      <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="neo-button-icon w-7 h-7 flex items-center justify-center rounded-full shrink-0">
        {playing ? <Pause className="w-3.5 h-3.5 text-primary" /> : <Play className="w-3.5 h-3.5 text-primary" />}
      </button>
      <div className="flex items-center gap-[2px] flex-1 h-6">
        {heights.map((h, i) => {
          const ratio = length ? progress / length : 0;
          const filled = i / bars <= ratio;
          return (
            <span
              key={i}
              className={`w-[2px] rounded-full ${filled ? "bg-primary" : "bg-muted-foreground/40"}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{fmt(length || 0)}</span>
    </div>
  );
};

export default VoiceNotePlayer;
