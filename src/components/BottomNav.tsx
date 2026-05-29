import { useState } from "react";
import { Home, Search, PlusSquare, Heart, User, BarChart3 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UploadDialog from "./UploadDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: BarChart3, path: "/charts", label: "Charts" },
  { icon: PlusSquare, path: null, label: "Create" }, // null path means it opens dialog
  { icon: Heart, path: "/activity", label: "Activity" },
  { icon: User, path: "/profile", label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const unread = useUnreadNotifications();

  const requireAuth = (path: string | null) => {
    if (!user && (path === null || path === "/profile" || path === "/activity")) {
      toast.error("Please sign in");
      navigate("/auth");
      return false;
    }
    return true;
  };


  return (
    <>
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
                  onClick={() => requireAuth(null) && setUploadDialogOpen(true)}
                  className="neo-button-icon w-11 h-11 flex items-center justify-center rounded-full transition-all text-muted-foreground hover:text-primary hover:scale-105"
                >
                  <Icon className="w-5 h-5" />
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
