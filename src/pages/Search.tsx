import { Search as SearchIcon, Film, Tv, ShoppingBag, Gamepad2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const categories = [
  { icon: Film, label: "Reels" },
  { icon: Tv, label: "IGTV" },
  { icon: ShoppingBag, label: "Store" },
  { icon: Gamepad2, label: "Games" },
];

const exploreImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=700&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=600&fit=crop",
];

const Search = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search Bar */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-4">
        <div className="max-w-lg mx-auto">
          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full neo-input py-3 pl-4 pr-10 text-sm placeholder:text-muted-foreground"
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <button className="neo-button-icon p-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-3 mb-4 overflow-x-auto hide-scrollbar py-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.label} className="category-pill flex-shrink-0">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 gap-3 space-y-3">
          {exploreImages.map((image, index) => (
            <div 
              key={index} 
              className="break-inside-avoid neo-card p-1 rounded-2xl overflow-hidden"
            >
              <img 
                src={image} 
                alt="" 
                className="w-full object-cover rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
