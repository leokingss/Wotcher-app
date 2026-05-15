import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import wotcherLanding from "@/assets/wotcher-landing.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-10">
      {/* Centered logo */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="relative w-[57%] max-w-[306px]"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Base logo (static) */}
          <img
            src={wotcherLanding}
            alt="Wotcher"
            className="w-full h-auto select-none"
            draggable={false}
          />
          {/* Animated overlay — clipped to the top wifi/bubble pink area only */}
          <img
            src={wotcherLanding}
            aria-hidden="true"
            className="wotcher-pink-shimmer absolute inset-0 w-full h-auto select-none pointer-events-none"
            draggable={false}
            style={{ clipPath: "inset(0 0 50% 0)" }}
          />
        </motion.div>
      </div>

      {/* Buttons between logo bottom and page bottom */}
      <motion.div
        className="w-full max-w-sm mx-auto pb-16 pt-8 flex items-center justify-center gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/auth?mode=signin")}
          className="flex-1 py-3.5 text-base font-semibold transition-all duration-200"
          style={{
            borderRadius: "2rem 0.5rem 2rem 0.5rem",
            background: "var(--gradient-signature)",
            color: "hsl(var(--primary-foreground))",
            boxShadow:
              "8px 8px 14px var(--neo-shadow-dark), -6px -6px 9px var(--neo-shadow-light)",
          }}
        >
          Sign in
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/auth?mode=signup")}
          className="flex-1 py-3.5 text-base font-semibold transition-all duration-200"
          style={{
            borderRadius: "0.5rem 2rem 0.5rem 2rem",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            boxShadow:
              "inset 6px 6px 7px var(--neo-inset-dark), inset -4px -4px 6px var(--neo-inset-light)",
          }}
        >
          Create an account
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Landing;
