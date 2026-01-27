import { Home, Search, PlusSquare, Film, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: PlusSquare, path: "/create", label: "Create" },
  { icon: Film, path: "/reels", label: "Reels" },
  { icon: User, path: "/profile", label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 transition-all ${
                isActive 
                  ? 'opacity-100 scale-105' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`}
                fill={isActive && item.icon !== PlusSquare ? 'currentColor' : 'none'}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
