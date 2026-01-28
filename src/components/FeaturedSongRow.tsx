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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dataPoints: number[] = Array(100).fill(0);

    const drawSeismograph = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      // Shift data left and add new point
      dataPoints.shift();
      
      let newPoint = 0;
      if (isPlaying) {
        // Create seismograph-like spikes
        const spike = Math.random() > 0.7 ? (Math.random() - 0.5) * 20 : 0;
        const tremor = (Math.random() - 0.5) * 8;
        const baseWave = Math.sin(phaseRef.current * 0.5) * 3;
        newPoint = spike + tremor + baseWave;
      } else {
        // Gentle flatline with tiny variations
        newPoint = (Math.random() - 0.5) * 1.5;
      }
      dataPoints.push(newPoint);
      
      // Draw the seismograph line
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(45, 100%, 55%)';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      dataPoints.forEach((point, i) => {
        const x = (i / dataPoints.length) * width;
        const y = centerY + point;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add glow effect when playing
      if (isPlaying) {
        ctx.strokeStyle = 'hsla(45, 100%, 55%, 0.3)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      
      phaseRef.current += 0.1;
      animationRef.current = requestAnimationFrame(drawSeismograph);
    };

    drawSeismograph();

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
