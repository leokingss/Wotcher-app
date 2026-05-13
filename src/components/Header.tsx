import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderDropdown from "./HeaderDropdown";
import WotcherLogo from "./WotcherLogo";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface HeaderProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unread = useUnreadMessages();

  return (
    <header className="bg-background">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => user ? navigate("/messages") : navigate("/auth")}
          className="neo-button-icon p-2 relative"
          aria-label="Messages"
        >
          <Send className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        <WotcherLogo />

        <HeaderDropdown activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  );
};

export default Header;
