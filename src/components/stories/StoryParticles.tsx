import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
}

interface ParticlesProps {
  kind: "snow" | "rain" | "sparkles" | "embers" | "fog";
  intensity: number; // 0..1
}

/**
 * Lightweight Canvas2D particle system used for environment filters.
 * - Capped at ~140 particles.
 * - Uses requestAnimationFrame and pauses on tab hide.
 * - `prefers-reduced-motion` users get a static low-density variant.
 */
export const StoryParticles = ({ kind, intensity }: ParticlesProps) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let running = true;
    const ps: Particle[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * window.devicePixelRatio);
      canvas.height = Math.max(1, r.height * window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const target = Math.round(
      ((kind === "fog" ? 4 : kind === "rain" ? 110 : kind === "snow" ? 80 : 60) *
        (reduced ? 0.4 : 1)) *
        intensity,
    );

    const spawn = (): Particle => {
      const w = canvas.width;
      const h = canvas.height;
      switch (kind) {
        case "snow":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.3 + Math.random() * 0.7,
            r: (1 + Math.random() * 2) * window.devicePixelRatio,
            life: 0,
            maxLife: 0,
          };
        case "rain":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -1.5,
            vy: 14 + Math.random() * 8,
            r: 1 * window.devicePixelRatio,
            life: 0,
            maxLife: 0,
          };
        case "sparkles":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            r: (0.6 + Math.random() * 1.4) * window.devicePixelRatio,
            life: 0,
            maxLife: 60 + Math.random() * 60,
          };
        case "embers":
          return {
            x: Math.random() * w,
            y: h + Math.random() * 20,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -1 - Math.random() * 1.2,
            r: (0.8 + Math.random() * 1.6) * window.devicePixelRatio,
            life: 0,
            maxLife: 80 + Math.random() * 60,
          };
        case "fog":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 0.2 + Math.random() * 0.3,
            vy: 0,
            r: (60 + Math.random() * 80) * window.devicePixelRatio,
            life: 0,
            maxLife: 0,
          };
      }
    };

    while (ps.length < target) ps.push(spawn());

    const step = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Re-spawn when out of bounds or dead.
        const dead =
          p.y > h + 10 ||
          p.y < -10 ||
          p.x < -50 ||
          p.x > w + 50 ||
          (p.maxLife > 0 && p.life > p.maxLife);
        if (dead) {
          ps[i] = spawn();
          continue;
        }

        ctx.beginPath();
        switch (kind) {
          case "snow": {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = "#ffffff";
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "rain": {
            ctx.globalAlpha = 0.55;
            ctx.strokeStyle = "rgba(220,235,255,0.7)";
            ctx.lineWidth = p.r;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 0.6);
            ctx.stroke();
            break;
          }
          case "sparkles": {
            const a =
              p.maxLife > 0
                ? Math.sin((p.life / p.maxLife) * Math.PI)
                : 1;
            ctx.globalAlpha = 0.9 * a;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
            grad.addColorStop(0, "rgba(255,255,255,1)");
            grad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "embers": {
            const a =
              p.maxLife > 0
                ? 1 - p.life / p.maxLife
                : 1;
            ctx.globalAlpha = a;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
            grad.addColorStop(0, "rgba(255,210,120,1)");
            grad.addColorStop(0.4, "rgba(255,120,40,0.8)");
            grad.addColorStop(1, "rgba(255,40,0,0)");
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "fog": {
            ctx.globalAlpha = 0.18;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            grad.addColorStop(0, "rgba(255,255,255,1)");
            grad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(step);
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kind, intensity]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
};

export default StoryParticles;
