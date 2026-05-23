import { useEffect, useRef } from "react";

interface WaveProgressProps {
  /** 0 → 1 progress through the current frame. */
  progress: number;
  /** Beats per minute. Drives the pulse rate. Defaults to 120. */
  bpm?: number;
  /** Whether the strand should look "playing" (animated) vs idle. */
  active?: boolean;
  /** Pixel height of the strand. */
  height?: number;
  className?: string;
}

/**
 * Beat-synced waveform progress strand. Used in <StoryViewer/> as the
 * top progress bar for music stories — it fills horizontally with
 * `progress` and pulses on the beat (`bpm`). Yellow → red gradient,
 * matching the app's signature wave identity.
 */
const WaveProgress = ({
  progress,
  bpm = 120,
  active = true,
  height = 6,
  className = "",
}: WaveProgressProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const progressRef = useRef(progress);
  const startedAtRef = useRef<number>(performance.now());
  const beatMs = (60 / Math.max(40, Math.min(220, bpm))) * 1000;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Beat envelope: 0→1→0 across one beat. Squared for sharper pulse.
      const sinceStart = performance.now() - startedAtRef.current;
      const beatPhase = (sinceStart % beatMs) / beatMs; // 0..1
      const beatPulse = active ? Math.pow(Math.sin(beatPhase * Math.PI), 2) : 0;

      const p = Math.max(0, Math.min(1, progressRef.current));
      const fillW = p * w;

      const segments = 56;
      const points: { x: number; y: number }[] = [];
      const phase = phaseRef.current;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const nx = i / segments;
        const envelope = Math.sin(nx * Math.PI) ** 0.5;
        const wave1 = Math.sin(phase + nx * 9);
        const wave2 = Math.sin(phase * 1.4 + nx * 14) * 0.4;
        const amp = (active ? 1.4 + beatPulse * 1.6 : 0.6) * envelope;
        points.push({ x, y: cy + (wave1 + wave2) * amp });
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

      // Background strand (untraveled portion) — faded white.
      buildPath();
      ctx.strokeStyle = "hsla(0, 0%, 100%, 0.22)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.stroke();

      // Foreground (traveled) strand — yellow→red, clipped to fillW.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, fillW, h);
      ctx.clip();

      // Glow on the beat
      if (active && beatPulse > 0.05) {
        buildPath();
        ctx.strokeStyle = `hsla(${45 - p * 35}, 100%, 65%, ${0.45 * beatPulse})`;
        ctx.lineWidth = 4 + beatPulse * 2;
        ctx.stroke();
      }

      buildPath();
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "hsla(45, 100%, 60%, 0.95)");
      grad.addColorStop(1, "hsla(10, 100%, 58%, 0.95)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8 + (active ? beatPulse * 0.8 : 0);
      ctx.stroke();
      ctx.restore();

      phaseRef.current += active ? 0.08 + beatPulse * 0.04 : 0.015;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, beatMs]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height, background: "transparent" }}
      aria-hidden
    />
  );
};

export default WaveProgress;
