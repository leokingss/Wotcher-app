import { useRef, useEffect } from "react";
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
  const phaseRef = useRef(0);

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
        analyserRef.current.fftSize = 128;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error('Audio context error:', e);
      }
    }

    // Define core positions
    const coreCount = 7;
    const getCorePositions = (width: number, height: number) => {
      const positions = [];
      for (let i = 0; i < coreCount; i++) {
        positions.push({
          x: (width / (coreCount + 1)) * (i + 1),
          y: height / 2,
          baseSize: 4 + (i % 3) * 2,
          phaseOffset: i * 0.7,
        });
      }
      return positions;
    };

    const drawGlowingCore = (
      x: number, 
      y: number, 
      size: number, 
      intensity: number, 
      hue: number,
      phase: number
    ) => {
      const breathe = 1 + Math.sin(phase) * 0.15;
      const coreSize = size * breathe * (0.5 + intensity * 0.5);
      
      // Layer 1: Outer diffuse glow
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, coreSize * 4);
      outerGlow.addColorStop(0, `hsla(${hue}, 100%, 60%, ${intensity * 0.3})`);
      outerGlow.addColorStop(0.3, `hsla(${hue - 5}, 100%, 55%, ${intensity * 0.15})`);
      outerGlow.addColorStop(0.6, `hsla(${hue - 10}, 100%, 50%, ${intensity * 0.05})`);
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, y, coreSize * 4, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Mid glow with warmth
      const midGlow = ctx.createRadialGradient(x, y, 0, x, y, coreSize * 2.5);
      midGlow.addColorStop(0, `hsla(${hue + 5}, 100%, 70%, ${intensity * 0.6})`);
      midGlow.addColorStop(0.4, `hsla(${hue}, 100%, 60%, ${intensity * 0.3})`);
      midGlow.addColorStop(0.7, `hsla(${hue - 5}, 100%, 55%, ${intensity * 0.1})`);
      midGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = midGlow;
      ctx.beginPath();
      ctx.arc(x, y, coreSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Layer 3: Inner intense glow
      const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, coreSize * 1.5);
      innerGlow.addColorStop(0, `hsla(${hue + 10}, 100%, 85%, ${intensity * 0.9})`);
      innerGlow.addColorStop(0.3, `hsla(${hue + 5}, 100%, 75%, ${intensity * 0.6})`);
      innerGlow.addColorStop(0.6, `hsla(${hue}, 100%, 65%, ${intensity * 0.3})`);
      innerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(x, y, coreSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Layer 4: Bright core center
      const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
      coreGradient.addColorStop(0, `hsla(55, 100%, 95%, ${0.3 + intensity * 0.7})`);
      coreGradient.addColorStop(0.3, `hsla(50, 100%, 85%, ${intensity * 0.8})`);
      coreGradient.addColorStop(0.6, `hsla(${hue + 5}, 100%, 70%, ${intensity * 0.5})`);
      coreGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Layer 5: Ultra-bright white center point
      if (intensity > 0.2) {
        const whiteCore = ctx.createRadialGradient(x, y, 0, x, y, coreSize * 0.3);
        whiteCore.addColorStop(0, `hsla(60, 100%, 100%, ${intensity})`);
        whiteCore.addColorStop(0.5, `hsla(55, 100%, 95%, ${intensity * 0.6})`);
        whiteCore.addColorStop(1, 'transparent');
        ctx.fillStyle = whiteCore;
        ctx.beginPath();
        ctx.arc(x, y, coreSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Clear canvas completely
      ctx.fillStyle = 'rgba(27, 28, 30, 1)';
      ctx.fillRect(0, 0, width, height);

      const corePositions = getCorePositions(width, height);
      let frequencyData: number[] = [];
      let overallIntensity = 0;
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequency bands to cores
        const bandsPerCore = Math.floor(dataArray.length / coreCount);
        for (let i = 0; i < coreCount; i++) {
          const start = i * bandsPerCore;
          const end = start + bandsPerCore;
          const bandAvg = dataArray.slice(start, end).reduce((a, b) => a + b, 0) / bandsPerCore / 255;
          frequencyData.push(bandAvg);
          overallIntensity += bandAvg;
        }
        overallIntensity /= coreCount;
      } else {
        // Idle breathing state
        for (let i = 0; i < coreCount; i++) {
          frequencyData.push(0.15 + Math.sin(phaseRef.current + i * 0.5) * 0.1);
        }
        overallIntensity = 0.2;
      }

      // Draw connecting ambient glow between cores
      if (overallIntensity > 0.1) {
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(0, centerY, width, centerY);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, `hsla(45, 100%, 55%, ${overallIntensity * 0.15})`);
        gradient.addColorStop(0.5, `hsla(50, 100%, 60%, ${overallIntensity * 0.25})`);
        gradient.addColorStop(0.8, `hsla(45, 100%, 55%, ${overallIntensity * 0.15})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, centerY - 8, width, 16);
      }

      // Draw each glowing core
      corePositions.forEach((core, index) => {
        const intensity = frequencyData[index] || 0.15;
        const hue = 40 + index * 3; // Subtle hue variation from yellow to orange
        drawGlowingCore(
          core.x, 
          core.y, 
          core.baseSize, 
          intensity, 
          hue, 
          phaseRef.current + core.phaseOffset
        );
      });

      phaseRef.current += isPlaying ? 0.04 : 0.015;

      phaseRef.current += isPlaying ? 0.05 : 0.01;
      animationRef.current = requestAnimationFrame(drawVisualization);
    };

    drawVisualization();

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
    <div className="flex items-center gap-2 py-1.5">
      <audio ref={audioRef} src={audioUrl} preload="auto" crossOrigin="anonymous" />
      
      <div className="neo-card p-0.5 rounded shrink-0">
        <img src={cover} alt={title} className="w-9 h-9 rounded-sm object-cover" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">{title}</p>
          <span className="text-muted-foreground text-xs">•</span>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        
        {/* Unique Energy Wave Visualization */}
        <canvas 
          ref={canvasRef} 
          width={240} 
          height={28}
          className="w-full h-7 rounded-lg"
          style={{ background: 'transparent' }}
        />
      </div>
      
      <button 
        onClick={() => onTogglePlay(id)}
        className={`neo-button-icon w-9 h-9 flex items-center justify-center shrink-0 transition-all duration-300 ${
          isPlaying ? 'neo-card-inset' : ''
        }`}
      >
        {isPlaying ? (
          <Square className="w-3.5 h-3.5 fill-primary text-primary" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-foreground text-foreground" />
        )}
      </button>
    </div>
  );
};

export default FeaturedSongRow;