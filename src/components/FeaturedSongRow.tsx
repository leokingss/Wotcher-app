import { useRef, useEffect, useState } from "react";
import { Play, Square } from "lucide-react";

interface FeaturedSongRowProps {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  isPlaying: boolean;
  onTogglePlay: (id: number) => void;
}

const FeaturedSongRow = ({ id, title, artist, cover, audioUrl, isPlaying, onTogglePlay }: FeaturedSongRowProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioData, setAudioData] = useState<number[]>(Array(16).fill(0).map((_, i) => 
    0.3 + Math.sin(i * 0.5) * 0.2
  ));
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
        
        // Organic flowing wave animation
        const updateVisualization = () => {
          phaseRef.current += 0.15;
          const newData = Array(16).fill(0).map((_, i) => {
            const wave1 = Math.sin(phaseRef.current + i * 0.4) * 0.3;
            const wave2 = Math.sin(phaseRef.current * 1.3 + i * 0.6) * 0.2;
            const wave3 = Math.sin(phaseRef.current * 0.7 + i * 0.3) * 0.15;
            return Math.max(0.15, Math.min(1, 0.5 + wave1 + wave2 + wave3));
          });
          setAudioData(newData);
          animationRef.current = requestAnimationFrame(updateVisualization);
        };
        updateVisualization();
      } else {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // Resting state - gentle sine wave
        setAudioData(Array(16).fill(0).map((_, i) => 
          0.25 + Math.sin(i * 0.5) * 0.1
        ));
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2 py-1">
      <audio ref={audioRef} src={audioUrl} preload="auto" crossOrigin="anonymous" />
      
      <div className="neo-card p-0.5 rounded shrink-0">
        <img src={cover} alt={title} className="w-8 h-8 rounded-sm object-cover" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">{title}</p>
          <span className="text-muted-foreground text-xs">•</span>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        
        {/* Sound Wave Visualization - Mirrored Bars */}
        <div className="flex items-center justify-between gap-[3px] h-4 w-full">
          {audioData.map((value, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-center gap-[1px]"
            >
              {/* Top bar */}
              <div
                className={`w-full rounded-t-full transition-all duration-150 ease-out ${
                  isPlaying 
                    ? 'bg-gradient-to-t from-primary/80 to-primary' 
                    : 'bg-muted-foreground/20'
                }`}
                style={{ 
                  height: `${value * 8}px`,
                }}
              />
              {/* Bottom bar (mirrored) */}
              <div
                className={`w-full rounded-b-full transition-all duration-150 ease-out ${
                  isPlaying 
                    ? 'bg-gradient-to-b from-primary/80 to-primary/40' 
                    : 'bg-muted-foreground/15'
                }`}
                style={{ 
                  height: `${value * 8}px`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={() => onTogglePlay(id)}
        className="neo-button-icon w-8 h-8 flex items-center justify-center shrink-0"
      >
        {isPlaying ? (
          <Square className="w-3 h-3 fill-primary text-primary" />
        ) : (
          <Play className="w-3 h-3 fill-foreground text-foreground" />
        )}
      </button>
    </div>
  );
};

export default FeaturedSongRow;
