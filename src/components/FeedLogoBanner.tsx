import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import wotcherLogoIcon from "@/assets/wotcher-logo-icon.png";

const FeedLogoBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden flex items-center justify-center"
        >
          <motion.img
            src={wotcherLogoIcon}
            alt="Wotcher"
            draggable={false}
            className="h-24 w-auto select-none my-3"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              filter:
                "drop-shadow(3px 3px 6px var(--neo-shadow-dark)) drop-shadow(-2px -2px 4px var(--neo-shadow-light))",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedLogoBanner;
