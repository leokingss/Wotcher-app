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

    const createParticle = (x: number, intensity: number): Particle => ({
      x,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * intensity * 3,
      life: 1,
      maxLife: 30 + Math.random() * 20,
      size: 1 + Math.random() * 2,
      hue: 40 + Math.random() * 20, // Yellow to orange range
    });

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(27, 28, 30, 0.15)';
      ctx.fillRect(0, 0, width, height);

      let intensity = 0;
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const bass = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
        const mid = dataArray.slice(8, 32).reduce((a, b) => a + b, 0) / 24 / 255;
        intensity = bass * 0.6 + mid * 0.4;

        // Spawn particles based on intensity
        if (Math.random() < intensity * 0.8) {
          const spawnX = Math.random() * width;
          particlesRef.current.push(createParticle(spawnX, intensity));
        }
      }

      // Draw flowing energy streams
      const numStreams = 3;
      for (let s = 0; s < numStreams; s++) {
        ctx.beginPath();
        
        const streamOffset = s * 0.7;
        const baseAmplitude = isPlaying ? 4 + intensity * 8 : 2;
        const hue = 45 - s * 8; // Yellow to orange gradient
        
        ctx.strokeStyle = `hsla(${hue}, 100%, ${55 + s * 5}%, ${0.6 - s * 0.15})`;
        ctx.lineWidth = 2 - s * 0.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let x = 0; x <= width; x += 2) {
          const normalizedX = x / width;
          
          // Complex wave combining multiple frequencies
          const wave1 = Math.sin(normalizedX * 8 + phaseRef.current + streamOffset) * baseAmplitude;
          const wave2 = Math.sin(normalizedX * 12 + phaseRef.current * 1.5 + streamOffset) * baseAmplitude * 0.5;
          const wave3 = Math.sin(normalizedX * 4 + phaseRef.current * 0.7 + streamOffset) * baseAmplitude * 0.3;
          
          // Envelope - fade at edges
          const envelope = Math.sin(normalizedX * Math.PI);
          const y = centerY + (wave1 + wave2 + wave3) * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life++;
        
        const lifeRatio = 1 - p.life / p.maxLife;
        if (lifeRatio <= 0) return false;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${lifeRatio * 0.8})`;
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3 * lifeRatio);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${lifeRatio * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 3 * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Draw center glow when playing
      if (isPlaying && intensity > 0.1) {
        const glowGradient = ctx.createRadialGradient(width / 2, centerY, 0, width / 2, centerY, 30 + intensity * 20);
        glowGradient.addColorStop(0, `hsla(45, 100%, 55%, ${intensity * 0.2})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
      }

      phaseRef.current += isPlaying ? 0.08 + intensity * 0.1 : 0.02;
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