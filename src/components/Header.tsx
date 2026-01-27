import { Settings, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button className="p-2 hover:opacity-60 transition-opacity">
          <Settings className="w-5 h-5" />
        </button>
        
        <h1 className="watcher-logo">Watcher</h1>
        
        <button className="p-2 hover:opacity-60 transition-opacity">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
