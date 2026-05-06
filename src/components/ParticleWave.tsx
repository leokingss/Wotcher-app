import { useEffect, useRef } from "react";

interface ParticleWaveProps {
  isPlaying: boolean;
  height?: number;
  className?: string;
}

/**
 * Dotted particle stream visualizer.
 * Particles flow left → right, scaling and shifting hue with a pseudo-amplitude.
 * Yellow → red gradient to match the app's signature audio identity.
 */
const ParticleWave = ({ isPlaying, height = 22, className = "" }: ParticleWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const particlesRef = useRef<Array<{ seed: number; speed: number; baseY: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    // Initialize particles
    const COUNT = 36;
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < COUNT; i++) {
        particlesRef.current.push({
          seed: Math.random() * 1000,
          speed: 0.35 + Math.random() * 0.5,
          baseY: 0.3 + Math.random() * 0.4,
        });
      }
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const phase = phaseRef.current;
      const pseudoIntensity = isPlaying ? 0.55 + Math.sin(phase * 0.6) * 0.3 : 0;
      const colorProgress = Math.min(1, pseudoIntensity * 1.2);
      const baseHue = 45 - colorProgress * 45; // yellow → red

      particlesRef.current.forEach((p, i) => {
        const nx = ((phase * p.speed * 0.06 + i / COUNT + p.seed * 0.001) % 1);
        // Edge fade envelope
        const envelope = Math.sin(nx * Math.PI) ** 0.7;
        // Wobble around center
        const wobble = Math.sin(phase * 1.4 + p.seed + nx * 6) * (isPlaying ? 5 : 1.2);
        const x = nx * w;
        const y = h / 2 + wobble * envelope + (p.baseY - 0.5) * (isPlaying ? 4 : 1);

        const size = isPlaying
          ? (1.2 + Math.abs(Math.sin(phase * 1.8 + p.seed)) * 1.6) * envelope
          : 0.9 * envelope;

        const hueShift = (i / COUNT) * 18 * colorProgress;
        const hue = Math.max(0, baseHue - hueShift);
        const sat = isPlaying ? 100 : 25;
        const light = isPlaying ? 60 + pseudoIntensity * 10 : 45;
        const alpha = (isPlaying ? 0.55 + pseudoIntensity * 0.4 : 0.35) * envelope;

        // Glow
        if (isPlaying && size > 0.6) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
          glow.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 8}%, ${alpha * 0.6})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, size * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core dot
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      phaseRef.current += isPlaying ? 0.7 + pseudoIntensity * 0.4 : 0.15;
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

const COUNT = 36;

export default ParticleWave;
