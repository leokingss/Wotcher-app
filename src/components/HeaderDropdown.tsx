import { useState, useRef, useEffect } from "react";
import { Menu, X, Sun, Moon, LogOut, LogIn, Mic2, Upload, BadgeCheck, FlaskConical, Package, Wallet, UserPlus, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import BecomeArtistDialog from "./BecomeArtistDialog";
import ArtistUploadDialog from "./ArtistUploadDialog";
import { FEED_MODES } from "@/lib/feedModes";

interface HeaderDropdownProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const HeaderDropdown = ({ activeTab, onTabChange }: HeaderDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isArtist = profile?.account_type === "artist";

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
        <div className="absolute right-0 top-12 z-50 neo-dropdown min-w-[280px] p-5 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Your feed, your rules</p>
            <p className="text-[11px] text-muted-foreground mb-3">Others decide what you see. We let you decide.</p>
            <div className="space-y-1.5">
              {FEED_MODES.map((mode) => {
                const isActive = activeTab === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onTabChange(mode.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${
                      isActive ? "neo-card-inset" : "neo-button-icon"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <mode.Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                        {mode.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground leading-snug">
                        {mode.tagline}
                      </span>
                    </span>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <span className="text-sm font-medium">{theme === "dark" ? "Dark Theme" : "Light Theme"}</span>
            <button
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === "dark"}
              className="relative w-14 h-8 rounded-full neo-card-inset transition-all"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full neo-button-icon flex items-center justify-center transition-all duration-300 ease-out ${
                  theme === "dark" ? "left-7 text-primary" : "left-1 text-primary"
                }`}
              >
                {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </span>
            </button>
          </div>

          {user && (
            <div className="border-t border-border pt-4 mt-4 space-y-2">
              {isArtist ? (
                <>
                  <div className="flex items-center gap-2 px-4 text-xs text-primary font-medium">
                    <BadgeCheck className="w-4 h-4" /> Artist Account
                  </div>
                  <button
                    onClick={() => { setIsOpen(false); setUploadDialogOpen(true); }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                  >
                    <span>Release music</span>
                    <Upload className="w-5 h-5 text-primary" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsOpen(false); setArtistDialogOpen(true); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                >
                  <span>Become an Artist</span>
                  <Mic2 className="w-5 h-5 text-primary" />
                </button>
              )}
            </div>
          )}

          <div className="border-t border-border pt-4 mt-4 space-y-2">
            {user && (
              <>
                <button
                  onClick={() => { setIsOpen(false); navigate("/wallet"); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                >
                  <span>Wallet</span>
                  <Wallet className="w-5 h-5 text-primary" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/orders"); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                >
                  <span>Orders</span>
                  <Package className="w-5 h-5 text-primary" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/payouts"); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                >
                  <span>Seller payouts</span>
                  <Wallet className="w-5 h-5 text-primary" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); navigate("/invite"); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
                >
                  <span>Invite friends</span>
                  <UserPlus className="w-5 h-5 text-primary" />
                </button>
              </>
            )}
            <button
              onClick={() => { setIsOpen(false); navigate("/labs"); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
            >
              <span>Wotcher Labs</span>
              <FlaskConical className="w-5 h-5 text-primary" />
            </button>
            {user ? (
              <button
                onClick={async () => { await signOut(); setIsOpen(false); navigate("/"); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
              >
                <span>Sign out</span>
                <LogOut className="w-5 h-5 text-primary" />
              </button>
            ) : (
              <button
                onClick={() => { setIsOpen(false); navigate("/auth"); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl neo-button-inset hover:text-primary transition-all"
              >
                <span>Sign in</span>
                <LogIn className="w-5 h-5 text-primary" />
              </button>
            )}
          </div>
        </div>
      )}

      <BecomeArtistDialog open={artistDialogOpen} onOpenChange={setArtistDialogOpen} />
      <ArtistUploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </div>
  );
};

export default HeaderDropdown;

