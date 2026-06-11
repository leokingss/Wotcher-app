import { useState } from "react";
import { Home, Search, PlusSquare, Heart, User, BarChart3, X, Image as ImageIcon, Music, Film, Sparkles, Radio } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UploadDialog from "./UploadDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: BarChart3, path: "/charts", label: "Charts" },
  { icon: PlusSquare, path: null, label: "Create" },
  { icon: Heart, path: "/activity", label: "Activity" },
  { icon: User, path: "/profile", label: "Profile" },
];

type RadialAction = {
  icon: typeof ImageIcon;
  label: string;
  color: string;
  onSelect: () => void;
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const unread = useUnreadNotifications();

  const requireAuth = (path: string | null) => {
    if (!user && (path === null || path === "/profile" || path === "/activity")) {
      toast.error("Please sign in");
      navigate("/auth");
      return false;
    }
    return true;
  };

  const openUpload = () => {
    setHubOpen(false);
    setUploadDialogOpen(true);
  };

  const radialActions: RadialAction[] = [
    { icon: ImageIcon, label: "Post", color: "text-primary", onSelect: openUpload },
    { icon: Music, label: "Song", color: "text-primary", onSelect: openUpload },
    { icon: Film, label: "Video", color: "text-primary", onSelect: openUpload },
    { icon: Sparkles, label: "Story", color: "text-primary", onSelect: openUpload },
    { icon: Radio, label: "Live", color: "text-destructive", onSelect: () => { setHubOpen(false); navigate("/live"); } },
  ];

  const handleHubToggle = () => {
    if (!requireAuth(null)) return;
    setHubOpen((v) => !v);
  };

  // Arc layout: items spread across an arc above the + button
  const radius = 115;
  const count = radialActions.length;
  const startAngle = 215; // degrees (180 = left, 270 = up, 360 = right)
  const endAngle = 325;
  const getOffset = (i: number) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = (startAngle + (endAngle - startAngle) * t) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  return (
    <>
      {/* Backdrop + radial menu */}
      <AnimatePresence>
        {hubOpen && (
          <>
            <motion.div
              key="hub-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
              onClick={() => setHubOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none">
              <div className="max-w-lg mx-auto relative h-0">
                <div
                  className="absolute left-1/2 pointer-events-none"
                  style={{ bottom: `calc(2.75rem + env(safe-area-inset-bottom))` }}
                >
                  {radialActions.map((action, i) => {
                    const { x, y } = getOffset(i);
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.label}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, scale: 0.2, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.2, y: 20 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 22,
                            delay: i * 0.04,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onSelect();
                          }}
                          className="pointer-events-auto flex flex-col items-center gap-1.5 focus:outline-none"
                        >
                          <span className={`neo-button-icon w-14 h-14 flex items-center justify-center rounded-full ${action.color}`}>
                            <Icon className="w-6 h-6" />
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/90">
                            {action.label}
                          </span>
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>


      <div className="fixed bottom-0 left-0 right-0 z-50">
        <nav className="neo-card max-w-lg mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between rounded-none rounded-t-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path ? location.pathname === item.path : false;
            const isCreateButton = item.path === null;

            if (isCreateButton) {
              return (
                <button
                  key={item.label}
                  onClick={handleHubToggle}
                  aria-expanded={hubOpen}
                  aria-label={hubOpen ? "Close create menu" : "Open create menu"}
                  className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                    hubOpen ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground hover:text-primary"
                  }`}
                >
                  <motion.span
                    animate={{ rotate: hubOpen ? 135 : 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="flex items-center justify-center"
                  >
                    {hubOpen ? <X className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.span>
                  {hubOpen && (
                    <motion.span
                      layoutId="hub-glow"
                      className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10"
                    />
                  )}
                </button>
              );
            }

            const showBadge = item.path === "/activity" && unread > 0;
            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={(e) => { if (!requireAuth(item.path)) e.preventDefault(); }}
                className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all ${
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
              </Link>
            );
          })}
        </nav>
      </div>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </>
  );
};

export default BottomNav;
