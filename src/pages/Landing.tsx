import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import wotcherLanding from "@/assets/wotcher-landing.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-10">
      <div className="flex-1 flex items-center justify-center">
        <motion.img
          src={wotcherLanding}
          alt="Wotcher"
          className="w-full max-w-xs sm:max-w-sm h-auto select-none"
          draggable={false}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <motion.div
        className="w-full max-w-sm mx-auto space-y-3 pb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <button
          onClick={() => navigate("/auth?mode=signin")}
          className="action-button action-button-primary w-full"
        >
          Sign in
        </button>
        <button
          onClick={() => navigate("/auth?mode=signup")}
          className="action-button w-full"
        >
          Create an account
        </button>
      </motion.div>
    </div>
  );
};

export default Landing;
