import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: PlusSquare, path: "/create", label: "Create" },
  { icon: Heart, path: "/activity", label: "Activity" },
  { icon: User, path: "/profile", label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <nav className="neo-card max-w-lg mx-auto px-4 py-3 flex items-center justify-between rounded-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
                isActive 
                  ? 'neo-card-inset text-primary' 
                  : 'neo-button-icon text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon 
                className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`}
                fill={isActive && item.icon !== PlusSquare ? 'currentColor' : 'none'}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
