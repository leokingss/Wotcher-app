import { useState } from "react";
import { Search as SearchIcon, Image, Music, Film, ShoppingBag } from "lucide-react";
import BottomNav from "@/components/BottomNav";
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

        {active === "Store" ? (
          listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No items for sale yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => {
                const isAuction = l.type === "auction";
                const display = isAuction ? (l.current_bid ?? l.starting_bid) : l.price;
                return (
                  <button
                    key={l.id}
                    onClick={() => setOpenListingId(l.id)}
                    className="group relative neo-card p-1.5 rounded-2xl text-left overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
                  >
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                      {l.image_url ? (
                        <img src={l.image_url} alt={l.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isAuction ? <Gavel className="w-8 h-8 text-muted-foreground" /> : <Tag className="w-8 h-8 text-muted-foreground" />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md ${
                          isAuction ? "bg-primary/90 text-primary-foreground" : "bg-background/80 text-foreground"
                        }`}>
                          {isAuction ? <Gavel className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                          {isAuction ? "AUCTION" : "BUY NOW"}
                        </span>
                        {isAuction && l.ends_at && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md tabular-nums">
                            <TimeLeft endsAt={l.ends_at} compact />
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-xs font-medium truncate opacity-90">{l.title}</p>
                        <p className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">
                          {isAuction ? (l.current_bid ? "Current bid" : "Starting at") : "Price"}
                        </p>
                        <p className="text-lg font-bold tabular-nums leading-tight">{fmt(display)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )
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
      <BottomNav />
    </div>
  );
};

export default Search;
