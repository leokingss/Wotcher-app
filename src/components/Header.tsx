import { Settings } from "lucide-react";
import HeaderDropdown from "./HeaderDropdown";

interface HeaderProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button className="neo-button-icon p-2">
          <Settings className="w-5 h-5" />
        </button>
        
        <h1 className="watcher-logo text-signature">Watcher</h1>
        
        <HeaderDropdown activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  );
};

export default Header;
