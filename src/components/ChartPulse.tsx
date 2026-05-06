import { motion } from "framer-motion";

interface ChartPulseProps {
  filled: number; // 0-10
  size?: number;
}

/**
 * Distinctive Top 10 visual: a 10-segment ring (one arc per slot) with
 * a yellow→red signature gradient, a slow radar sweep, and a pulsing
 * core that mirrors the app's strand-wave color identity.
 */
const ChartPulse = ({ filled, size = 64 }: ChartPulseProps) => {
  const segments = 10;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const gap = 4; // px gap between segments
  const segLen = circumference / segments - gap;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="-32 -32 64 64" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="strand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45, 100%, 55%)" />
            <stop offset="100%" stopColor="hsl(0, 100%, 55%)" />
          </linearGradient>
          <filter id="strand-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.15)"
          strokeWidth={3}
          strokeDasharray={`${segLen} ${gap}`}
        />

        {/* Filled segments */}
        {filled > 0 && (
          <circle
            r={radius}
            fill="none"
            stroke="url(#strand-grad)"
            strokeWidth={3}
            strokeLinecap="butt"
            strokeDasharray={`${segLen} ${gap}`}
            strokeDashoffset={-(circumference - (segLen + gap) * filled) + 0}
            // We use a mask-like trick: draw full ring then hide trailing arc.
            style={{
              filter: "url(#strand-glow)",
              strokeDasharray: Array(filled)
                .fill(`${segLen} ${gap}`)
                .join(" ") + ` 0 ${circumference}`,
            }}
          />
        )}

        {/* Radar sweep */}
        <motion.line
          x1={0}
          y1={0}
          x2={radius - 2}
          y2={0}
          stroke="hsl(45, 100%, 60%)"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.55}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "0 0" }}
        />
      </svg>

      {/* Pulsing core with count */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute rounded-full bg-primary/20"
          animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          style={{ width: 28, height: 28 }}
        />
        <div className="relative flex flex-col items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(0,100%,55%)] shadow-[0_0_12px_hsl(45,100%,50%,0.5)]">
          <span className="text-[11px] font-black text-primary-foreground leading-none tabular-nums">
            {filled}
          </span>
          <span className="text-[7px] font-bold text-primary-foreground/80 leading-none mt-0.5">
            /10
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartPulse;
