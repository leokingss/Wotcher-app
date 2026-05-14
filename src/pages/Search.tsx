import { useState } from "react";
import { Search as SearchIcon, Image, Music, Film, ShoppingBag } from "lucide-react";
import { exploreImages } from "@/data/mockSocial";
import ListingDialog from "@/components/ListingDialog";
import ShopView from "@/components/ShopView";

type Category = "Photos" | "Music" | "Movies" | "Shop";

const categories: { icon: any; label: Category }[] = [
  { icon: Image, label: "Photos" },
  { icon: Music, label: "Music" },
  { icon: Film, label: "Movies" },
  { icon: ShoppingBag, label: "Shop" },
];

const Search = () => {
  const [active, setActive] = useState<Category>("Photos");
  const [openListingId, setOpenListingId] = useState<string | null>(null);

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
        <div className="flex justify-evenly mb-4 py-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = active === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActive(cat.label)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <span className={`neo-button-icon p-3 ${isActive ? "!text-primary" : ""}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-xs ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {active === "Shop" ? (
          <ShopView onOpenListing={setOpenListingId} />
        ) : (
          /* Masonry Grid */
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
        )}
      </div>

      <ListingDialog open={!!openListingId} onOpenChange={(o) => !o && setOpenListingId(null)} listingId={openListingId} />
    </div>
  );
};

export default Search;
