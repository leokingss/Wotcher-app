import { Heart, MessageCircle, PlusSquare } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="instagram-logo">Instagram</h1>
        
        <div className="flex items-center gap-5">
          <button className="hover:opacity-60 transition-opacity">
            <PlusSquare className="w-6 h-6" />
          </button>
          <button className="hover:opacity-60 transition-opacity relative">
            <Heart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 instagram-gradient-bg rounded-full text-[10px] text-white flex items-center justify-center font-medium">
              3
            </span>
          </button>
          <button className="hover:opacity-60 transition-opacity relative">
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 instagram-gradient-bg rounded-full text-[10px] text-white flex items-center justify-center font-medium">
              5
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
