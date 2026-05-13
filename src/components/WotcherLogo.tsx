import { motion } from "framer-motion";

const WotcherLogo = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Neumorphic animated mark */}
      <div
        className="relative w-9 h-9 rounded-2xl flex items-center justify-center"
        style={{
          background: "hsl(var(--background))",
          boxShadow:
            "4px 4px 10px var(--neo-shadow-dark), -4px -4px 10px var(--neo-shadow-light), inset 1px 1px 2px var(--neo-shadow-light)",
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="w-6 h-6 overflow-visible">
          <defs>
            <linearGradient id="wotcher-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8c8c8" />
              <stop offset="100%" stopColor="#c8a4d4" />
            </linearGradient>
            <radialGradient id="wotcher-bubble-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffd0d8" />
              <stop offset="100%" stopColor="#e07a96" />
            </radialGradient>
          </defs>

          {/* Outer arc — emanating wave */}
          <motion.path
            d="M6 22 Q20 4 34 22"
            stroke="url(#wotcher-arc-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 1],
              opacity: [0, 1, 1, 0.85],
            }}
            transition={{
              duration: 3.2,
              times: [0, 0.4, 0.8, 1],
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: "easeInOut",
            }}
            style={{
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
            }}
          />

          {/* Speech bubble (the dot of an "i" reimagined as a chat bubble) */}
          <motion.g
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.08, 1, 1], opacity: [0, 1, 1, 1] }}
            transition={{
              duration: 1.2,
              times: [0, 0.6, 0.8, 1],
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "20px 25px" }}
          >
            <circle
              cx="20"
              cy="25"
              r="5.5"
              fill="url(#wotcher-bubble-grad)"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            />
            {/* tail */}
            <path
              d="M19 30 L19.5 34 L22 30 Z"
              fill="#e07a96"
            />
          </motion.g>
        </svg>
      </div>

      {/* Wordmark */}
      <h1 className="watcher-logo text-signature leading-none">Wotcher</h1>
    </div>
  );
};

export default WotcherLogo;
