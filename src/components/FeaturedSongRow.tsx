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
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
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
      
      // Clear canvas
      ctx.fillStyle = 'rgba(27, 28, 30, 1)';
      ctx.fillRect(0, 0, width, height);

      let bass = 0;
      let mid = 0;
      let high = 0;
      let frequencyData: number[] = [];
      
      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
        mid = dataArray.slice(10, 40).reduce((a, b) => a + b, 0) / 30 / 255;
        high = dataArray.slice(40, 80).reduce((a, b) => a + b, 0) / 40 / 255;
        
        // Sample frequency data for strand nodes
        for (let i = 0; i < 12; i++) {
          const idx = Math.floor((i / 12) * dataArray.length);
          frequencyData.push(dataArray[idx] / 255);
        }
      }

      const nodeCount = 12;
      const nodeSpacing = width / (nodeCount + 1);
      const phase = phaseRef.current;
      
      // Calculate strand amplitude based on playing state
      const amplitude = isPlaying ? 6 + bass * 8 : 0;
      const waveSpeed = isPlaying ? 0.08 : 0;

      // Draw connecting energy field (only when playing)
      if (isPlaying && (bass > 0.3 || mid > 0.3)) {
        const energyGradient = ctx.createLinearGradient(0, 0, width, 0);
        energyGradient.addColorStop(0, 'transparent');
        energyGradient.addColorStop(0.3, `hsla(45, 100%, 55%, ${bass * 0.08})`);
        energyGradient.addColorStop(0.5, `hsla(50, 100%, 60%, ${mid * 0.12})`);
        energyGradient.addColorStop(0.7, `hsla(45, 100%, 55%, ${bass * 0.08})`);
        energyGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = energyGradient;
        ctx.fillRect(0, centerY - 10, width, 20);
      }

      // Calculate node positions for both strands
      const topStrand: {x: number, y: number}[] = [];
      const bottomStrand: {x: number, y: number}[] = [];
      
      for (let i = 0; i < nodeCount; i++) {
        const x = nodeSpacing * (i + 1);
        const waveOffset = Math.sin(phase + i * 0.6) * amplitude;
        const freqBoost = isPlaying && frequencyData[i] ? frequencyData[i] * 4 : 0;
        
        topStrand.push({ x, y: centerY - waveOffset - freqBoost });
        bottomStrand.push({ x, y: centerY + waveOffset + freqBoost });
      }

      // Draw flowing strand connections (top)
      if (isPlaying) {
        ctx.beginPath();
        ctx.moveTo(topStrand[0].x, topStrand[0].y);
        for (let i = 1; i < topStrand.length; i++) {
          const xc = (topStrand[i].x + topStrand[i - 1].x) / 2;
          const yc = (topStrand[i].y + topStrand[i - 1].y) / 2;
          ctx.quadraticCurveTo(topStrand[i - 1].x, topStrand[i - 1].y, xc, yc);
        }
        ctx.strokeStyle = `hsla(45, 100%, 65%, ${0.3 + mid * 0.4})`;
        ctx.lineWidth = 1.5 + bass * 1.5;
        ctx.stroke();

        // Draw flowing strand connections (bottom)
        ctx.beginPath();
        ctx.moveTo(bottomStrand[0].x, bottomStrand[0].y);
        for (let i = 1; i < bottomStrand.length; i++) {
          const xc = (bottomStrand[i].x + bottomStrand[i - 1].x) / 2;
          const yc = (bottomStrand[i].y + bottomStrand[i - 1].y) / 2;
          ctx.quadraticCurveTo(bottomStrand[i - 1].x, bottomStrand[i - 1].y, xc, yc);
        }
        ctx.strokeStyle = `hsla(40, 100%, 60%, ${0.3 + mid * 0.4})`;
        ctx.lineWidth = 1.5 + bass * 1.5;
        ctx.stroke();

        // Draw cross-connections (DNA rungs) on beats
        if (bass > 0.4) {
          for (let i = 0; i < nodeCount; i += 2) {
            const gradient = ctx.createLinearGradient(
              topStrand[i].x, topStrand[i].y,
              bottomStrand[i].x, bottomStrand[i].y
            );
            gradient.addColorStop(0, `hsla(50, 100%, 70%, ${bass * 0.4})`);
            gradient.addColorStop(0.5, `hsla(55, 100%, 80%, ${bass * 0.6})`);
            gradient.addColorStop(1, `hsla(50, 100%, 70%, ${bass * 0.4})`);
            
            ctx.beginPath();
            ctx.moveTo(topStrand[i].x, topStrand[i].y);
            ctx.lineTo(bottomStrand[i].x, bottomStrand[i].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + bass;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodeCount; i++) {
        const nodeIntensity = isPlaying ? (frequencyData[i] || 0.2) : 0.15;
        const nodeSize = isPlaying ? 2 + nodeIntensity * 3 : 1.5;
        const hue = 42 + (i % 3) * 5;
        
        // Top strand node
        if (isPlaying) {
          // Glow
          const topGlow = ctx.createRadialGradient(
            topStrand[i].x, topStrand[i].y, 0,
            topStrand[i].x, topStrand[i].y, nodeSize * 3
          );
          topGlow.addColorStop(0, `hsla(${hue}, 100%, 70%, ${nodeIntensity * 0.8})`);
          topGlow.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${nodeIntensity * 0.3})`);
          topGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = topGlow;
          ctx.beginPath();
          ctx.arc(topStrand[i].x, topStrand[i].y, nodeSize * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Core node (top)
        ctx.beginPath();
        ctx.fillStyle = isPlaying 
          ? `hsla(${hue}, 100%, ${70 + nodeIntensity * 20}%, ${0.5 + nodeIntensity * 0.5})`
          : 'hsla(45, 40%, 45%, 0.3)';
        ctx.arc(topStrand[i].x, topStrand[i].y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Bottom strand node (only when playing)
        if (isPlaying) {
          const bottomGlow = ctx.createRadialGradient(
            bottomStrand[i].x, bottomStrand[i].y, 0,
            bottomStrand[i].x, bottomStrand[i].y, nodeSize * 3
          );
          bottomGlow.addColorStop(0, `hsla(${hue - 5}, 100%, 65%, ${nodeIntensity * 0.7})`);
          bottomGlow.addColorStop(0.5, `hsla(${hue - 5}, 100%, 55%, ${nodeIntensity * 0.25})`);
          bottomGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = bottomGlow;
          ctx.beginPath();
          ctx.arc(bottomStrand[i].x, bottomStrand[i].y, nodeSize * 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.fillStyle = `hsla(${hue - 5}, 100%, ${65 + nodeIntensity * 20}%, ${0.5 + nodeIntensity * 0.5})`;
          ctx.arc(bottomStrand[i].x, bottomStrand[i].y, nodeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Static dormant line when not playing
      if (!isPlaying) {
        ctx.beginPath();
        ctx.strokeStyle = 'hsla(45, 30%, 40%, 0.2)';
        ctx.lineWidth = 1;
        ctx.moveTo(nodeSpacing, centerY);
        ctx.lineTo(width - nodeSpacing, centerY);
        ctx.stroke();
      }

      phaseRef.current += waveSpeed;
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