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

interface WavePoint {
  x: number;
  y: number;
}

const FeaturedSongRow = ({ id, title, artist, cover, audioUrl, isPlaying, onTogglePlay }: FeaturedSongRowProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  const waveColors = [
    'hsl(45, 100%, 55%)',   // Bright yellow
    'hsl(35, 100%, 50%)',   // Orange-yellow
    'hsl(20, 100%, 50%)',   // Orange
    'hsl(0, 85%, 55%)',     // Red
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaves = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      waveColors.forEach((color, waveIndex) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        const phaseOffset = waveIndex * 0.8;
        const amplitudeBase = isPlaying ? 6 + waveIndex * 1.5 : 2 + waveIndex * 0.5;
        const frequency = 0.03 + waveIndex * 0.008;
        
        for (let x = 0; x <= width; x += 2) {
          const normalizedX = x / width;
          // Amplitude envelope - bigger in middle, smaller at edges
          const envelope = Math.sin(normalizedX * Math.PI) * 0.8 + 0.2;
          
          const wave1 = Math.sin(x * frequency + phaseRef.current + phaseOffset);
          const wave2 = Math.sin(x * frequency * 1.5 + phaseRef.current * 1.2 + phaseOffset) * 0.5;
          const wave3 = Math.sin(x * frequency * 0.5 + phaseRef.current * 0.8 + phaseOffset) * 0.3;
          
          const amplitude = amplitudeBase * envelope * (isPlaying ? 1 : 0.4);
          const y = centerY + (wave1 + wave2 + wave3) * amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      });
      
      if (isPlaying) {
        phaseRef.current += 0.08;
      } else {
        phaseRef.current += 0.015;
      }
      
      animationRef.current = requestAnimationFrame(drawWaves);
    };

    drawWaves();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
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
        
        {/* Morphing Wave Lines Canvas */}
        <canvas 
          ref={canvasRef} 
          width={200} 
          height={24}
          className="w-full h-6"
        />
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
