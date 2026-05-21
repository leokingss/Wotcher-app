import { useRef, useEffect } from "react";
import { Play, Square } from "lucide-react";

interface FeaturedSongRowProps {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  isPlaying: boolean;
  onTogglePlay: (id: string | number) => void;
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
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.75;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error('Audio context error:', e);
      }
    }

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Get background color from CSS custom property (theme-aware)
      const computedStyle = getComputedStyle(document.documentElement);
      const bgHsl = computedStyle.getPropertyValue('--background').trim();
      const bgColor = bgHsl ? `hsl(${bgHsl})` : 'hsl(220, 8%, 11%)';
      
      // Clear canvas with theme background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      let bass = 0;
      let mid = 0;
      let high = 0;
      let intensity = 0;
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
        mid = dataArray.slice(10, 50).reduce((a, b) => a + b, 0) / 40 / 255;
        high = dataArray.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255;
        intensity = (bass * 0.5 + mid * 0.3 + high * 0.2);
      }

      const phase = phaseRef.current;
      
      // Color calculation: yellow (45) to red (0) based on high frequencies and intensity
      const colorProgress = isPlaying ? Math.min(1, (high * 0.7 + intensity * 0.3) * 1.5) : 0;
      const baseHue = 45 - colorProgress * 45; // 45 (yellow) → 0 (red)
      
      // Strand configuration - 5 interweaving strands
      const strands = [
        { amplitude: 1, frequency: 1, phaseOffset: 0, opacity: 0.9 },
        { amplitude: 0.8, frequency: 1.3, phaseOffset: Math.PI * 0.4, opacity: 0.7 },
        { amplitude: 0.6, frequency: 1.7, phaseOffset: Math.PI * 0.8, opacity: 0.5 },
        { amplitude: 0.7, frequency: 0.8, phaseOffset: Math.PI * 1.2, opacity: 0.6 },
        { amplitude: 0.5, frequency: 2.1, phaseOffset: Math.PI * 1.6, opacity: 0.4 },
      ];

      // Base amplitude affected by bass
      const baseAmplitude = isPlaying ? 4 + bass * 8 : 2;
      
      // Draw each strand
      strands.forEach((strand, strandIndex) => {
        const points: {x: number, y: number}[] = [];
        const segments = 60;
        
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;
          const normalizedX = i / segments;
          
          // Create envelope - fade at edges
          const envelope = Math.sin(normalizedX * Math.PI) ** 0.5;
          
          // Multiple wave components for organic feel
          const wave1 = Math.sin(phase * strand.frequency + normalizedX * 8 + strand.phaseOffset);
          const wave2 = Math.sin(phase * strand.frequency * 1.5 + normalizedX * 12 + strand.phaseOffset) * 0.3;
          const wave3 = Math.sin(phase * strand.frequency * 0.7 + normalizedX * 5 + strand.phaseOffset) * 0.2;
          
          // High frequency adds turbulence
          const turbulence = isPlaying ? Math.sin(phase * 3 + normalizedX * 20) * high * 2 : 0;
          
          const combinedWave = (wave1 + wave2 + wave3 + turbulence) * strand.amplitude;
          const y = centerY + combinedWave * baseAmplitude * envelope;
          
          points.push({ x, y });
        }

        // Calculate strand-specific hue shift (creates gradient across strands)
        const strandHueOffset = strandIndex * 8 * colorProgress;
        const strandHue = Math.max(0, baseHue - strandHueOffset);
        const saturation = isPlaying ? 100 : 30;
        const lightness = isPlaying ? 55 + intensity * 15 : 40;
        
        // Draw strand glow
        if (isPlaying) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
          ctx.strokeStyle = `hsla(${strandHue}, ${saturation}%, ${lightness + 10}%, ${strand.opacity * 0.3 * intensity})`;
          ctx.lineWidth = 4 + bass * 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw main strand line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        // Gradient along the strand
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        const startHue = Math.max(0, strandHue + 10);
        const endHue = Math.max(0, strandHue - 15 * colorProgress);
        
        gradient.addColorStop(0, `hsla(${startHue}, ${saturation}%, ${lightness}%, ${strand.opacity * 0.3})`);
        gradient.addColorStop(0.3, `hsla(${strandHue}, ${saturation}%, ${lightness}%, ${strand.opacity})`);
        gradient.addColorStop(0.7, `hsla(${endHue}, ${saturation}%, ${lightness}%, ${strand.opacity})`);
        gradient.addColorStop(1, `hsla(${endHue}, ${saturation}%, ${lightness}%, ${strand.opacity * 0.3})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isPlaying ? 1.5 + intensity * 1 : 1;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Add bright nodes at wave peaks when intensity is high
      if (isPlaying && intensity > 0.4) {
        const nodeCount = Math.floor(3 + intensity * 5);
        for (let i = 0; i < nodeCount; i++) {
          const x = 20 + (i / nodeCount) * (width - 40);
          const waveY = Math.sin(phase + (i / nodeCount) * 8) * baseAmplitude;
          const y = centerY + waveY * (0.5 + Math.random() * 0.5);
          const nodeSize = 1 + intensity * 2;
          const nodeHue = baseHue - Math.random() * 20 * colorProgress;
          
          const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, nodeSize * 3);
          nodeGlow.addColorStop(0, `hsla(${nodeHue}, 100%, 80%, ${intensity * 0.8})`);
          nodeGlow.addColorStop(0.5, `hsla(${nodeHue}, 100%, 65%, ${intensity * 0.3})`);
          nodeGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update phase - faster when more intense
      const speed = isPlaying ? 0.04 + intensity * 0.06 : 0.01;
      phaseRef.current += speed;
      
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