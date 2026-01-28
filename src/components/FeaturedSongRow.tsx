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
  const [audioData, setAudioData] = useState<number[]>(Array(24).fill(0.2));
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
        
        // Simulate sound wave animation
        const updateVisualization = () => {
          const newData = Array(24).fill(0).map(() => 
            Math.random() * 0.7 + 0.3
          );
          setAudioData(newData);
          animationRef.current = requestAnimationFrame(updateVisualization);
        };
        updateVisualization();
      } else {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioData(Array(24).fill(0.2));
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
        
        {/* Sound Wave Visualization - Full Width */}
        <div className="flex items-end justify-between gap-[2px] h-3 w-full">
          {audioData.map((value, index) => (
            <div
              key={index}
              className={`flex-1 max-w-[4px] rounded-full transition-all duration-100 ${
                isPlaying 
                  ? 'bg-gradient-to-t from-primary to-primary/60' 
                  : 'bg-muted-foreground/30'
              }`}
              style={{ 
                height: `${value * 100}%`,
                minHeight: '15%'
              }}
            />
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
