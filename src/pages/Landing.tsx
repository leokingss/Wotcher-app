import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import wotcherLanding from "@/assets/wotcher-landing.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-10">
      {/* Centered logo */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <motion.img
          src={wotcherLanding}
          alt="Wotcher"
          className="w-[57%] max-w-[306px] h-auto select-none"
          draggable={false}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      {/* Buttons positioned between logo bottom and page bottom */}
      <motion.div
        className="w-full max-w-sm mx-auto space-y-3 pb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/auth?mode=signin")}
          className="w-full rounded-2xl py-4 text-base font-semibold transition-all duration-200"
          style={{
            background: "var(--gradient-signature)",
            color: "hsl(var(--primary-foreground))",
            boxShadow:
              "8px 8px 18px var(--neo-shadow-dark), -6px -6px 14px var(--neo-shadow-light)",
          }}
        >
          Sign in
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/auth?mode=signup")}
          className="w-full rounded-2xl py-4 text-base font-semibold transition-all duration-200"
          style={{
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            boxShadow:
              "inset 6px 6px 12px var(--neo-inset-dark), inset -4px -4px 10px var(--neo-inset-light)",
          }}
        >
          Create an account
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Landing;
