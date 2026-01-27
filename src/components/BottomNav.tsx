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
      <nav className="floating-nav max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`p-3 rounded-full transition-all ${
                isActive 
                  ? 'bg-primary/20 text-primary-foreground scale-110' 
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`}
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
