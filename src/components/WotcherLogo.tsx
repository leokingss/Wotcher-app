import { motion } from "framer-motion";
import wotcherLogo from "@/assets/wotcher-logo.png";

const WotcherLogo = () => {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="h-20 w-20 rounded-2xl bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url(${wotcherLogo})`,
          filter:
            "drop-shadow(2px 2px 4px var(--neo-shadow-dark)) drop-shadow(-1px -1px 2px var(--neo-shadow-light))",
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        aria-label="Wotcher"
      />
    </motion.div>
  );
};

export default WotcherLogo;
