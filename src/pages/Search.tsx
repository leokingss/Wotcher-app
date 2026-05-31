import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Image, Music, Film, ShoppingBag, Grid3X3, SlidersHorizontal, Check, Users, Globe, Sparkles, UserCheck, Loader2 } from "lucide-react";
import { exploreImages } from "@/data/mockSocial";
import ListingDialog from "@/components/ListingDialog";
import ShopView from "@/components/ShopView";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = "All" | "Photos" | "Music" | "Movies" | "Shop";
type Source = "everyone" | "friends" | "following" | "suggested";
type ContentType = "photos" | "music" | "movies" | "shop";

// Lightweight tags so the AI has something to reason about per item.
// In production these would come from real metadata / vision tags.
const exploreTags: string[][] = [
  ["portrait", "warm", "people", "natural-light"],
  ["abstract", "moody", "texture"],
  ["fashion", "studio", "editorial"],
  ["street", "urban", "candid"],
  ["nature", "landscape", "golden-hour"],
  ["portrait", "lifestyle", "outdoor"],
  ["macro", "detail", "nature"],
  ["travel", "landscape", "minimal"],
];

// Mock taste profile — would normally be derived from real interactions.
const tasteProfile = {
  likedTags: ["portrait", "golden-hour", "minimal", "editorial"],
  dislikedTags: ["loud-color"],
  recentInteractions: [
    { tag: "portrait", weight: 0.9 },
    { tag: "natural-light", weight: 0.7 },
    { tag: "landscape", weight: 0.4 },
  ],
  favoriteCategories: ["photography", "music"],
  followingStyles: ["lifestyle", "editorial"],
};

type RankedPick = { id: string; score: number; reason: string };


const categories: { icon: any; label: Category }[] = [
  { icon: Grid3X3, label: "All" },
  { icon: Image, label: "Photos" },
  { icon: Music, label: "Music" },
  { icon: Film, label: "Movies" },
  { icon: ShoppingBag, label: "Shop" },
];

const sources: { id: Source; label: string; icon: any; desc: string }[] = [
  { id: "everyone", label: "Everyone", icon: Globe, desc: "Suggestions from the whole community" },
  { id: "friends", label: "Friends only", icon: Users, desc: "Only people in your circles" },
  { id: "following", label: "People you follow", icon: UserCheck, desc: "Accounts you already follow" },
  { id: "suggested", label: "Suggested for you", icon: Sparkles, desc: "Personalized picks" },
];

const contentTypes: { id: ContentType; label: string; icon: any }[] = [
  { id: "photos", label: "Photos", icon: Image },
  { id: "music", label: "Music", icon: Music },
  { id: "movies", label: "Movies", icon: Film },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

const Search = () => {
  const [active, setActive] = useState<Category>("All");
  const [openListingId, setOpenListingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [source, setSource] = useState<Source>("everyone");
  const [types, setTypes] = useState<ContentType[]>(["photos", "music", "movies", "shop"]);
  const [suggesting, setSuggesting] = useState(false);
  const [ranked, setRanked] = useState<RankedPick[] | null>(null);

  const toggleType = (id: ContentType) => {
    setTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  // Run AI personalization when "Suggested for you" is selected.
  useEffect(() => {
    if (source !== "suggested") {
      setRanked(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setSuggesting(true);
      try {
        const candidates = exploreImages.map((_, i) => ({
          id: String(i),
          tags: exploreTags[i] ?? [],
          kind: "photo",
        }));
        const { data, error } = await supabase.functions.invoke(
          "personalized-suggestions",
          { body: { profile: tasteProfile, candidates, limit: 12 } },
        );
        if (cancelled) return;
        if (error) {
          const status = (error as any)?.context?.status;
          const msg = status === 429
            ? "Too many requests — try again in a moment."
            : status === 402
              ? "AI credits exhausted. Add credits to keep curating."
              : "Couldn't load personalized picks.";
          toast.error(msg);
          setRanked([]);
        } else {
          setRanked((data?.ranked as RankedPick[]) ?? []);
        }
      } catch {
        if (!cancelled) {
          toast.error("Couldn't load personalized picks.");
          setRanked([]);
        }
      } finally {
        if (!cancelled) setSuggesting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  const displayed = useMemo(() => {
    if (source === "suggested" && ranked && ranked.length > 0) {
      return ranked
        .map((r) => ({
          src: exploreImages[Number(r.id)],
          reason: r.reason,
        }))
        .filter((x) => !!x.src);
    }
    return exploreImages.map((src) => ({ src, reason: null as string | null }));
  }, [source, ranked]);

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
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="neo-button-icon p-3" aria-label="Filter">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Show suggestions from</h3>
                  <div className="space-y-2">
                    {sources.map((s) => {
                      const Icon = s.icon;
                      const isActive = source === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSource(s.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left ${isActive ? "neo-button-icon !text-primary" : "neo-card"}`}
                        >
                          <span className="neo-button-icon p-2 flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>{s.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Content type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {contentTypes.map((c) => {
                      const Icon = c.icon;
                      const isActive = types.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleType(c.id)}
                          className={`flex items-center gap-2 p-3 rounded-2xl ${isActive ? "neo-button-icon !text-primary" : "neo-card"}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className={`text-sm ${isActive ? "text-primary font-semibold" : ""}`}>{c.label}</span>
                          {isActive && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setSource("everyone");
                      setTypes(["photos", "music", "movies", "shop"]);
                    }}
                    className="flex-1 neo-card p-3 rounded-2xl text-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex-1 neo-button-icon p-3 rounded-2xl text-sm !text-primary font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Categories — directly below search bar */}
        <div className="flex justify-center gap-6 mb-4 py-2">
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
