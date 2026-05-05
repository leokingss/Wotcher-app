import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack } from "lucide-react";

interface ReactionButtonProps {
  type: "like" | "dislike";
  active: boolean;
  count?: number | string;
  onClick: () => void;
  showCount?: boolean;
  size?: "sm" | "md";
}

const ReactionButton = ({ type, active, count, onClick, showCount = true, size = "md" }: ReactionButtonProps) => {
  const Icon = type === "like" ? Heart : HeartCrack;
  const activeColor = type === "like" ? "fill-red-500 text-red-500" : "fill-red-500 text-red-900";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const padding = size === "sm" ? "p-1.5" : "p-2.5";
  const burstRadius = size === "sm" ? 12 : 18;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`neo-button-icon ${padding} flex items-center gap-1.5 relative`}
    >
      <motion.div
        key={`${active}`}
        animate={active ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative"
      >
        <Icon className={`${iconSize} ${active ? activeColor : ""}`} />
        <AnimatePresence>
          {active && (
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
