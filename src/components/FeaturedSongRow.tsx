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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataPointsRef = useRef<number[]>(Array(80).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup audio analyzer once
    if (!audioContextRef.current && isPlaying) {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.7;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error('Audio context error:', e);
      }
    }

    const drawSeismograph = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      // Shift data left
      dataPointsRef.current.shift();
      
      let newPoint = 0;
      
      if (isPlaying && analyserRef.current) {
        // Get real audio frequency data
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude from bass and mid frequencies
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const mid = dataArray.slice(10, 50).reduce((a, b) => a + b, 0) / 40;
        const high = dataArray.slice(50, 100).reduce((a, b) => a + b, 0) / 50;
        
        // Combine frequencies for seismograph effect
        const intensity = (bass * 0.5 + mid * 0.35 + high * 0.15) / 255;
        newPoint = (intensity - 0.3) * 25 + (Math.random() - 0.5) * intensity * 8;
      } else if (isPlaying) {
        // Fallback animation if audio context fails
        newPoint = (Math.random() - 0.5) * 10;
      } else {
        // Gentle flatline
        newPoint = (Math.random() - 0.5) * 1;
      }
      
      dataPointsRef.current.push(newPoint);
      
      // Draw the seismograph line
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(45, 100%, 55%)';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      dataPointsRef.current.forEach((point, i) => {
        const x = (i / dataPointsRef.current.length) * width;
        const y = centerY + point;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Glow effect based on audio intensity
      if (isPlaying) {
        ctx.strokeStyle = 'hsla(45, 100%, 55%, 0.25)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      
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
