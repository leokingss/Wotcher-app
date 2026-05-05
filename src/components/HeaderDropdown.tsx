import { useState, useRef, useEffect } from "react";
import { Menu, X, Sun, Moon, LogOut, LogIn } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const feedOptions = [
  { id: 1, label: "Live Feed" },
  { id: 2, label: "Popular" },
  { id: 3, label: "Algorithm" },
];

interface HeaderDropdownProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const HeaderDropdown = ({ activeTab, onTabChange }: HeaderDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="neo-button-icon p-2"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 neo-dropdown min-w-[200px] p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Feed Options</p>
            <div className="space-y-2">
              {feedOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onTabChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    activeTab === option.id
                      ? "neo-button-active text-primary"
                      : "neo-button-inset hover:text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
            >
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderDropdown;
