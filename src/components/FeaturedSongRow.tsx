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

interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  hue: number;
  intensity: number;
}

const FeaturedSongRow = ({ id, title, artist, cover, audioUrl, isPlaying, onTogglePlay }: FeaturedSongRowProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ringsRef = useRef<Ring[]>([]);
  const lastBeatRef = useRef(0);
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
        analyserRef.current.smoothingTimeConstant = 0.75;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error('Audio context error:', e);
      }
    }

    const spawnRing = (x: number, intensity: number): Ring => ({
      x,
      y: canvas.height / 2,
      radius: 2,
      maxRadius: 25 + intensity * 20,
      life: 0,
      hue: 40 + Math.random() * 15,
      intensity,
    });

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const now = Date.now();
      
      // Clear with slight fade for trail effect
      ctx.fillStyle = 'rgba(27, 28, 30, 0.25)';
      ctx.fillRect(0, 0, width, height);

      let bass = 0;
      let mid = 0;
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        bass = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
        mid = dataArray.slice(8, 24).reduce((a, b) => a + b, 0) / 16 / 255;

        // Spawn rings on strong beats with cooldown
        if (bass > 0.55 && now - lastBeatRef.current > 120) {
          const spawnCount = bass > 0.75 ? 3 : bass > 0.65 ? 2 : 1;
          for (let i = 0; i < spawnCount; i++) {
            const x = width * (0.2 + Math.random() * 0.6);
            ringsRef.current.push(spawnRing(x, bass));
          }
          lastBeatRef.current = now;
        }

        // Occasional mid-frequency rings
        if (mid > 0.5 && Math.random() < 0.15) {
          ringsRef.current.push(spawnRing(width * (0.3 + Math.random() * 0.4), mid * 0.7));
        }
      } else {
        // Idle: gentle ambient rings
        if (Math.random() < 0.02) {
          ringsRef.current.push(spawnRing(width * (0.3 + Math.random() * 0.4), 0.3));
        }
      }

      // Draw subtle center line
      ctx.beginPath();
      ctx.strokeStyle = `hsla(45, 60%, 50%, ${isPlaying ? 0.12 : 0.06})`;
      ctx.lineWidth = 1;
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Update and draw rings
      ringsRef.current = ringsRef.current.filter(ring => {
        ring.life += 1;
        const progress = ring.radius / ring.maxRadius;
        if (progress >= 1) return false;

        // Expand ring
        ring.radius += 0.8 + ring.intensity * 0.6;
        
        const alpha = (1 - progress) * ring.intensity;

        // Outer glow ring
        ctx.beginPath();
        const outerGradient = ctx.createRadialGradient(
          ring.x, ring.y, ring.radius - 3,
          ring.x, ring.y, ring.radius + 6
        );
        outerGradient.addColorStop(0, 'transparent');
        outerGradient.addColorStop(0.4, `hsla(${ring.hue}, 100%, 60%, ${alpha * 0.3})`);
        outerGradient.addColorStop(0.6, `hsla(${ring.hue}, 100%, 55%, ${alpha * 0.5})`);
        outerGradient.addColorStop(0.8, `hsla(${ring.hue}, 100%, 60%, ${alpha * 0.3})`);
        outerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGradient;
        ctx.arc(ring.x, ring.y, ring.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Main ring stroke
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${ring.hue + 5}, 100%, 70%, ${alpha * 0.9})`;
        ctx.lineWidth = 2 + ring.intensity * 2;
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner bright ring
        ctx.beginPath();
        ctx.strokeStyle = `hsla(55, 100%, 85%, ${alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.arc(ring.x, ring.y, ring.radius - 1, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });

      // Limit rings
      if (ringsRef.current.length > 20) {
        ringsRef.current = ringsRef.current.slice(-20);
      }

      // Draw center pulse that reacts to bass
      const pulseIntensity = isPlaying ? 0.2 + bass * 0.6 : 0.1 + Math.sin(phaseRef.current) * 0.05;
      const pulseSize = isPlaying ? 3 + bass * 8 : 3;
      
      const centerGlow = ctx.createRadialGradient(width / 2, centerY, 0, width / 2, centerY, pulseSize * 3);
      centerGlow.addColorStop(0, `hsla(50, 100%, 80%, ${pulseIntensity})`);
      centerGlow.addColorStop(0.4, `hsla(45, 100%, 65%, ${pulseIntensity * 0.5})`);
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, pulseSize * 3, 0, Math.PI * 2);
      ctx.fill();

      phaseRef.current += isPlaying ? 0.05 : 0.02;
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