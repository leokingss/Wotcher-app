import { motion } from "framer-motion";
import StrandWave from "./StrandWave";

interface ChartTowerProps {
  filled: number; // 0-10
  activeRank?: number | null; // currently expanded/selected rank (1-10)
  width?: number;
  height?: number;
}

/**
 * Signature Top 10 visual: 10 stacked strand-wave bars.
 * Rank #1 is thickest & fully animated, tapering down to a thin #10.
 * Empty slots render as flat dotted placeholder lines.
 * Reinforces the app's signature wave identity (SongCard, MiniPlayer).
 */
const ChartTower = ({ filled, activeRank = 1, width = 88, height = 72 }: ChartTowerProps) => {
  const slots = Array.from({ length: 10 }, (_, i) => i + 1);

  // Thickness curve: rank 1 = tallest band, rank 10 = thinnest.
  // Total height divided so taller bars get proportionally more room.
  const weights = slots.map((r) => 1 + (10 - r) * 0.35); // 4.15 → 1
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const gap = 1;
  const usableHeight = height - gap * 9;

  return (
    <div
      className="relative shrink-0 flex flex-col justify-between"
      style={{ width, height }}
      aria-hidden
    >
      {slots.map((rank, idx) => {
        const isFilled = rank <= filled;
        const isActive = rank === activeRank && isFilled;
        const bandHeight = (weights[idx] / totalWeight) * usableHeight;

        if (!isFilled) {
          return (
            <div
              key={rank}
              style={{ height: bandHeight }}
              className="flex items-center"
            >
              <div className="w-full border-t border-dashed border-muted-foreground/20" />
            </div>
          );
        }

        return (
          <motion.div
            key={rank}
            layout
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: isActive ? 1 : 0.55, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5"
            style={{ height: bandHeight }}
          >
            <span
              className={`text-[8px] font-black tabular-nums leading-none w-3 text-right ${
                isActive ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              {rank}
            </span>
            <div className="flex-1 min-w-0" style={{ height: Math.max(bandHeight - 1, 4) }}>
              <StrandWave
                isPlaying={isActive}
                height={Math.max(bandHeight - 1, 4)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChartTower;
