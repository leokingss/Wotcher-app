import { AnimatePresence, motion } from "framer-motion";
import { Pause, X } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import StrandWave from "./StrandWave";

const MiniPlayer = () => {
  const { track, stop } = usePlayer();

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-[88px] left-4 right-4 z-40 pointer-events-none"
          aria-live="polite"
        >
          <div className="neo-card max-w-lg mx-auto px-3 py-2 rounded-2xl flex items-center gap-3 pointer-events-auto">
            <div className="neo-card-inset p-0.5 rounded-lg shrink-0">
              <img src={track.cover} alt={track.title} className="w-9 h-9 rounded-md object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{track.title}</p>
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-muted-foreground truncate shrink-0 max-w-[40%]">{track.artist}</p>
                <div className="flex-1 min-w-0">
                  <StrandWave isPlaying={true} height={16} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={stop}
                aria-label="Pause"
                className="neo-button-icon w-9 h-9 flex items-center justify-center"
              >
                <Pause className="w-4 h-4 fill-foreground" />
              </button>
              <button
                onClick={stop}
                aria-label="Close player"
                className="neo-button-icon w-9 h-9 flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
