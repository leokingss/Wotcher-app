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
  const [audioData, setAudioData] = useState<number[]>(Array(12).fill(0.2));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Create audio context only once
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 32;
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
        
        audioRef.current.play();
        
        // Start visualization
        const updateVisualization = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const normalizedData = Array.from(dataArray.slice(0, 12)).map(v => Math.max(0.15, v / 255));
            setAudioData(normalizedData);
          }
          animationRef.current = requestAnimationFrame(updateVisualization);
        };
        updateVisualization();
      } else {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioData(Array(12).fill(0.2));
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
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="neo-card p-0.5 rounded">
        <img src={cover} alt={title} className="w-8 h-8 rounded-sm object-cover" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">{title}</p>
          <span className="text-muted-foreground text-xs">•</span>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        
        {/* Sound Wave Visualization */}
        <div className="flex items-end gap-[2px] h-3">
          {audioData.map((value, index) => (
            <div
              key={index}
              className={`w-[3px] rounded-full transition-all duration-75 ${
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
        className="neo-button-icon w-8 h-8 flex items-center justify-center"
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
