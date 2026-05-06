import { useEffect, useRef } from "react";

interface StrandWaveProps {
  isPlaying: boolean;
  height?: number;
  className?: string;
}

/**
 * Slim single-strand version of the FeaturedSongRow visualizer.
 * Synthetic (no audio analyser) so it works anywhere a song is "playing".
 * Yellow → red gradient with a soft glow, matching the app's signature wave.
 */
const StrandWave = ({ isPlaying, height = 22, className = "" }: StrandWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle DPR for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      const phase = phaseRef.current;
      // Pseudo "intensity" oscillates so color shifts even without real audio
      const pseudoIntensity = isPlaying ? 0.5 + Math.sin(phase * 0.6) * 0.3 : 0;
      const colorProgress = Math.min(1, pseudoIntensity * 1.2);
      const baseHue = 45 - colorProgress * 45; // yellow → red
      const baseAmp = isPlaying ? 3 + pseudoIntensity * 4 : 1.2;

      const segments = 48;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const nx = i / segments;
        const envelope = Math.sin(nx * Math.PI) ** 0.6;
        const wave1 = Math.sin(phase + nx * 8);
        const wave2 = Math.sin(phase * 1.5 + nx * 12) * 0.35;
        const wave3 = Math.sin(phase * 0.7 + nx * 5) * 0.25;
        const y = centerY + (wave1 + wave2 + wave3) * baseAmp * envelope;
        points.push({ x, y });
      }

      const buildPath = () => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
      };

      const sat = isPlaying ? 100 : 25;
      const light = isPlaying ? 58 + pseudoIntensity * 12 : 45;

      // Glow pass
      if (isPlaying) {
        buildPath();
        ctx.strokeStyle = `hsla(${baseHue}, ${sat}%, ${light + 10}%, ${0.35 * pseudoIntensity})`;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Main strand with horizontal gradient
      buildPath();
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      const startHue = Math.max(0, baseHue + 8);
      const endHue = Math.max(0, baseHue - 18 * colorProgress);
      gradient.addColorStop(0, `hsla(${startHue}, ${sat}%, ${light}%, 0.25)`);
      gradient.addColorStop(0.3, `hsla(${baseHue}, ${sat}%, ${light}%, 0.95)`);
      gradient.addColorStop(0.7, `hsla(${endHue}, ${sat}%, ${light}%, 0.95)`);
      gradient.addColorStop(1, `hsla(${endHue}, ${sat}%, ${light}%, 0.25)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isPlaying ? 1.6 : 1;
      ctx.lineCap = "round";
      ctx.stroke();

      phaseRef.current += isPlaying ? 0.06 + pseudoIntensity * 0.04 : 0.012;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height, background: "transparent" }}
      aria-hidden
    />
  );
};

export default StrandWave;
