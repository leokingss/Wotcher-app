import { motion } from "framer-motion";
import wotcherLogoIcon from "@/assets/wotcher-logo-icon.png";

const WotcherLogo = () => {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.img
        src={wotcherLogoIcon}
        alt="Wotcher"
        className="h-9 w-auto select-none"
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
