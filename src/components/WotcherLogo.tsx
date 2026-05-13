import { motion } from "framer-motion";
import wotcherLogo from "@/assets/wotcher-logo.png";

const WotcherLogo = () => {
  return (
    <motion.div
      className="flex items-center justify-center overflow-hidden h-16 w-16"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.img
        src={wotcherLogo}
        alt="Wotcher"
        className="h-24 w-auto select-none object-cover object-top"
        draggable={false}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter:
            "drop-shadow(2px 2px 4px var(--neo-shadow-dark)) drop-shadow(-1px -1px 2px var(--neo-shadow-light))",
        }}
      />
    </motion.div>
  );
};

export default WotcherLogo;
