import { motion } from "framer-motion";

interface VinylCounterProps {
  filled: number; // 0-10
  cover?: string; // #1 album cover
  size?: number;
}

/**
 * Spinning vinyl disc with the #1 album art at the center label.
 * 10 notches around the rim represent chart slots — filled notches glow
 * yellow→red, empty ones stay muted. Reinforces the cassette/record motif.
 */
const VinylCounter = ({ filled, cover, size = 76 }: VinylCounterProps) => {
  const notches = Array.from({ length: 10 }, (_, i) => i);
  const radius = 46; // notch placement radius in viewBox units

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Notches ring (static) */}
      <svg viewBox="-50 -50 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="vinyl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 100%, 55%)" />
            <stop offset="100%" stopColor="hsl(0, 100%, 55%)" />
          </linearGradient>
        </defs>
        {notches.map((i) => {
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isFilled = i < filled;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isFilled ? 2.6 : 1.8}
              fill={isFilled ? "url(#vinyl-grad)" : "hsl(var(--muted-foreground) / 0.25)"}
              style={isFilled ? { filter: "drop-shadow(0 0 2px hsl(45,100%,55%,0.7))" } : undefined}
            />
          );
        })}
      </svg>

      {/* Spinning vinyl disc */}
      <motion.div
        className="absolute inset-1.5 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(0,0%,18%) 0%, hsl(0,0%,8%) 60%, hsl(0,0%,4%) 100%)",
          boxShadow:
            "inset 0 0 0 1px hsl(0,0%,0%), 0 2px 6px hsl(0,0%,0%,0.4)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {/* Concentric grooves */}
        <div className="absolute inset-0 rounded-full opacity-40"
          style={{
            background:
              "repeating-radial-gradient(circle at 50% 50%, hsl(0,0%,30%) 0 1px, transparent 1px 3px)",
          }}
        />

        {/* Center label with album art */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: "32%",
            boxShadow: "0 0 0 1px hsl(0,0%,0%,0.6), 0 0 0 2px hsl(45,100%,50%,0.4)",
          }}
        >
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-[hsl(0,100%,55%)]" />
          )}
          {/* Spindle hole */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-background" />
        </div>
      </motion.div>

      {/* Counter badge */}
      <div className="absolute -bottom-0.5 -right-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-br from-primary to-[hsl(0,100%,55%)] shadow-[0_0_8px_hsl(45,100%,50%,0.5)]">
        <span className="text-[9px] font-black text-primary-foreground leading-none tabular-nums">
          {filled}/10
        </span>
      </div>
    </div>
  );
};

export default VinylCounter;
