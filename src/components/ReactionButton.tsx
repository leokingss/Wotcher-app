import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack } from "lucide-react";
import { useEffect, useState } from "react";

interface ReactionButtonProps {
  type: "like" | "dislike";
  active: boolean;
  count?: number | string;
  onClick: () => void;
  showCount?: boolean;
  size?: "sm" | "md";
}

const ReactionButton = ({ type, active, count, onClick, showCount = true, size = "md" }: ReactionButtonProps) => {
  const isDislike = type === "dislike";
  // For dislike: show whole Heart until "smashed", then swap to HeartCrack
  const [smashed, setSmashed] = useState(active);
  const [hammering, setHammering] = useState(false);

  const Icon = isDislike ? (smashed ? HeartCrack : Heart) : Heart;
  const activeColor = isDislike ? "fill-red-500 text-red-900" : "fill-red-500 text-red-500";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const padding = size === "sm" ? "p-1.5" : "p-2.5";
  const burstRadius = size === "sm" ? 12 : 18;
  const hammerSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  // Trigger hammer sequence when dislike turns on
  useEffect(() => {
    if (!isDislike) return;
    if (active && !smashed) {
      setHammering(true);
      const swap = setTimeout(() => setSmashed(true), 380); // strike moment
      const end = setTimeout(() => setHammering(false), 700);
      return () => {
        clearTimeout(swap);
        clearTimeout(end);
      };
    }
    if (!active && smashed) {
      setSmashed(false);
      setHammering(false);
    }
  }, [active, isDislike, smashed]);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`neo-button-icon ${padding} flex items-center gap-1.5 relative`}
    >
      <motion.div
        key={`${type}-${active}-${smashed}`}
        animate={active ? (isDislike && smashed ? { x: [0, -2, 2, -1, 0] } : { scale: [1, 1.4, 1] }) : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative"
      >
        <Icon className={`${iconSize} ${active ? activeColor : ""}`} />

        {/* Hammer animation for dislike */}
        {isDislike && (
          <AnimatePresence>
            {hammering && (
              <motion.div
                key="hammer"
                initial={{ opacity: 0, x: -24, y: -4, rotate: -90, scale: 0.7 }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  x: [-24, -16, -8, -16, -24],
                  y: [-4, -8, -12, -8, -4],
                  rotate: [-90, -60, -30, -60, -90],
                  scale: [0.7, 1, 1.1, 1, 0.7],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.3, 0.55, 0.8, 1] }}
                style={{ transformOrigin: "100% 100%" }}
                className="absolute left-0 top-0 pointer-events-none"
              >
                <Hammer className={`${hammerSize} text-foreground drop-shadow`} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Burst particles (likes; or dislike crack debris) */}
        <AnimatePresence>
          {active && (!isDislike || smashed) && (
            <>
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: 0,
                      x: Math.cos(angle) * burstRadius,
                      y: Math.sin(angle) * burstRadius,
                      scale: 1,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-red-500 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
      </motion.div>
      {showCount && count !== undefined && (
        <span className={`${size === "sm" ? "text-[10px] text-muted-foreground" : "text-sm"} font-medium`}>{count}</span>
      )}
    </motion.button>
  );
};

export default ReactionButton;
