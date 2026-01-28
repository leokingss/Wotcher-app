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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  type: 'spark' | 'trail' | 'burst';
}

const FeaturedSongRow = ({ id, title, artist, cover, audioUrl, isPlaying, onTogglePlay }: FeaturedSongRowProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const particlesRef = useRef<Particle[]>([]);
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

    const createParticle = (x: number, intensity: number, type: 'spark' | 'trail' | 'burst' = 'spark'): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'burst' ? 2 + Math.random() * 4 : 0.5 + Math.random() * 2;
      return {
        x,
        y: canvas.height / 2 + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed * intensity,
        vy: Math.sin(angle) * speed * intensity,
        life: 0,
        maxLife: type === 'burst' ? 20 + Math.random() * 15 : 40 + Math.random() * 30,
        size: type === 'burst' ? 2 + Math.random() * 3 : 1 + Math.random() * 2,
        hue: 35 + Math.random() * 25, // Yellow to orange-red
        type,
      };
    };

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Clear with stronger fade for particle trails
      ctx.fillStyle = 'rgba(27, 28, 30, 0.12)';
      ctx.fillRect(0, 0, width, height);

      let intensity = 0;
      let bass = 0;
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        bass = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
        const mid = dataArray.slice(8, 32).reduce((a, b) => a + b, 0) / 24 / 255;
        intensity = bass * 0.6 + mid * 0.4;

        // Spawn trail particles continuously
        for (let i = 0; i < 3; i++) {
          if (Math.random() < intensity) {
            particlesRef.current.push(createParticle(Math.random() * width, intensity, 'trail'));
          }
        }

        // Spawn burst particles on beats
        if (bass > 0.6 && Math.random() < 0.4) {
          const burstX = width * 0.3 + Math.random() * width * 0.4;
          for (let i = 0; i < 8; i++) {
            particlesRef.current.push(createParticle(burstX, intensity * 1.5, 'burst'));
          }
        }

        // Spawn spark particles
        if (Math.random() < intensity * 0.6) {
          particlesRef.current.push(createParticle(Math.random() * width, intensity, 'spark'));
        }
      } else {
        // Idle state - gentle floating particles
        if (Math.random() < 0.05) {
          particlesRef.current.push(createParticle(Math.random() * width, 0.3, 'trail'));
        }
      }

      // Draw subtle baseline
      ctx.beginPath();
      ctx.strokeStyle = `hsla(45, 60%, 50%, ${isPlaying ? 0.15 : 0.08})`;
      ctx.lineWidth = 1;
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Update and draw particles with different behaviors
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        const lifeRatio = 1 - p.life / p.maxLife;
        if (lifeRatio <= 0) return false;

        // Different physics per type
        if (p.type === 'burst') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
        } else if (p.type === 'trail') {
          p.x += p.vx + Math.sin(p.life * 0.1) * 0.5;
          p.y += p.vy + Math.cos(p.life * 0.15) * 0.3;
          p.vx *= 0.99;
          p.vy *= 0.98;
        } else {
          p.x += p.vx;
          p.y += p.vy + Math.sin(p.life * 0.2) * 0.5;
          p.vy += (centerY - p.y) * 0.01; // Pull back to center
        }

        const currentSize = p.size * lifeRatio;
        const alpha = lifeRatio * (p.type === 'burst' ? 1 : 0.8);

        // Draw outer glow
        const glowSize = currentSize * (p.type === 'burst' ? 6 : 4);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${alpha * 0.5})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 55%, ${alpha * 0.2})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, ${70 + (1 - lifeRatio) * 20}%, ${alpha})`;
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Add bright center for bursts
        if (p.type === 'burst' && lifeRatio > 0.5) {
          ctx.beginPath();
          ctx.fillStyle = `hsla(50, 100%, 90%, ${alpha * 0.8})`;
          ctx.arc(p.x, p.y, currentSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        return true;
      });

      // Limit particles
      if (particlesRef.current.length > 150) {
        particlesRef.current = particlesRef.current.slice(-150);
      }

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