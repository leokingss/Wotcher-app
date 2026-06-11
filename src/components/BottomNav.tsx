import { useState } from "react";
import { Home, Search, PlusSquare, Heart, User, BarChart3 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UploadDialog from "./UploadDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { usePlayer } from "@/hooks/usePlayer";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: BarChart3, path: "/charts", label: "Charts" },
  { icon: PlusSquare, path: null, label: "Create" },
  { icon: Heart, path: "/activity", label: "Activity" },
  { icon: User, path: "/profile", label: "Profile" },
];

// Tiny equalizer bars used when audio is playing globally
const PlayingBars = () => (
  <span className="absolute -top-1 -right-1 flex items-end gap-[2px] h-3 w-3.5 pointer-events-none">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-[2px] rounded-full bg-primary"
        animate={{ height: ["20%", "100%", "40%", "80%", "30%"] }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.12,
        }}
        style={{ originY: 1 }}
      />
    ))}
  </span>
);

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const unread = useUnreadNotifications();
  const { track } = usePlayer();

  const requireAuth = (path: string | null) => {
    if (!user && (path === null || path === "/profile" || path === "/activity")) {
      toast.error("Please sign in");
      navigate("/auth");
      return false;
    }
    return true;
  };

  // Context morph: pulsing red LIVE dot when user is inside a live room
  const inLive = location.pathname.startsWith("/live/");
  const onProfile = location.pathname.startsWith("/profile");

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Contextual strip above the dock */}
        <AnimatePresence>
          {inLive && (
            <motion.div
              key="live-strip"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="max-w-lg mx-auto px-4 pb-1 flex justify-center"
            >
              <div className="neo-card px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
                </span>
                <span className="text-destructive">Live</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="neo-card max-w-lg mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between rounded-none rounded-t-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path
              ? item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)
              : false;
            const isCreateButton = item.path === null;

            if (isCreateButton) {
              return (
                <motion.button
                  key={item.label}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => requireAuth(null) && setUploadDialogOpen(true)}
                  className="neo-button-icon w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary"
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              );
            }

            const showBadge = item.path === "/activity" && unread > 0;
            const showPlaying = item.path === "/" && !!track;
            const showProfileDot = item.path === "/profile" && onProfile;

            return (
              <motion.div
                key={item.path}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {/* Liquid glow blob travels between active tabs */}
                {isActive && (
                  <motion.span
                    layoutId="nav-blob"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at center, hsl(var(--primary) / 0.35), transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />
                )}

                <Link
                  to={item.path!}
                  onClick={(e) => { if (!requireAuth(item.path)) e.preventDefault(); }}
                  className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? 'neo-card-inset text-primary'
                      : 'neo-button-icon text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`}
                    fill={isActive ? 'currentColor' : 'none'}
                  />

                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}

                  {showPlaying && <PlayingBars />}
                </Link>

                {/* Active strand underline */}
                {isActive && (
                  <motion.span
                    layoutId="nav-strand"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(45 100% 50%) 0%, hsl(15 100% 55%) 100%)",
                      boxShadow: "0 0 8px hsl(45 100% 50% / 0.6)",
                    }}
                  />
                )}

                {/* Section dots for profile when active */}
                {showProfileDot && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 h-0.5 rounded-full bg-primary/60"
                      />
                    ))}
                  </span>
                )}
              </motion.div>
            );
          })}
        </nav>
      </div>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </>
  );
};

export default BottomNav;
