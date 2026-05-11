import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  SlidersHorizontal, ChevronDown, Layers, Image as ImageIcon, Music,
  Video, ShoppingBag, MapPin, MessageSquare, Gavel, Tag, X,
  Sparkles, TrendingUp, Flame, Disc3, Mic2, Camera, Film,
  Shirt, Watch, Glasses, Palette, Footprints, Gem, Sofa, Book,
  Smartphone, Heart, Package,
} from "lucide-react";

export type FeedCategory = "all" | "photos" | "music" | "video" | "shop";

export type MusicMood = "new" | "popular" | "trending" | "throwback";
export type VideoMood = "new" | "popular" | "trending" | "shorts";

export const MUSIC_GENRES = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Classical",
  "Country", "Latin", "Afrobeats", "K-Pop", "Indie", "Lo-Fi", "Reggae",
] as const;
export type MusicGenre = (typeof MUSIC_GENRES)[number];

export const VIDEO_GENRES = [
  "Vlog", "Tutorial", "Comedy", "Music Video", "Live", "Performance",
  "Travel", "Food", "Sports", "Gaming", "Fashion", "Documentary",
] as const;
export type VideoGenre = (typeof VIDEO_GENRES)[number];

export const SHOP_CATEGORIES = [
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "shoes", label: "Shoes", icon: Footprints },
  { id: "watches", label: "Watches", icon: Watch },
  { id: "glasses", label: "Glasses", icon: Glasses },
  { id: "jewelry", label: "Jewelry", icon: Gem },
  { id: "paintings", label: "Paintings", icon: Palette },
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "books", label: "Books", icon: Book },
  { id: "tech", label: "Tech", icon: Smartphone },
  { id: "beauty", label: "Beauty", icon: Heart },
  { id: "other", label: "Other", icon: Package },
] as const;
export type ShopCategoryId = (typeof SHOP_CATEGORIES)[number]["id"];

// Keyword match map per shop category
const SHOP_KEYWORDS: Record<ShopCategoryId, string[]> = {
  clothing: ["shirt", "tee", "jacket", "coat", "dress", "pants", "jeans", "hoodie", "sweater", "skirt", "suit", "clothing", "apparel", "wear"],
  shoes: ["shoe", "sneaker", "boot", "heel", "loafer", "sandal", "trainer", "cleat"],
  watches: ["watch", "rolex", "omega", "timepiece", "chronograph"],
  glasses: ["glass", "sunglass", "eyewear", "frame", "lens", "shades"],
  jewelry: ["jewelry", "ring", "necklace", "bracelet", "earring", "chain", "pendant", "gold", "silver", "diamond"],
  paintings: ["painting", "art", "canvas", "print", "drawing", "sketch", "watercolor", "oil"],
  furniture: ["chair", "table", "sofa", "lamp", "desk", "bed", "shelf", "furniture", "stool"],
  books: ["book", "novel", "magazine", "comic", "manga"],
  tech: ["phone", "laptop", "camera", "tablet", "console", "headphone", "speaker", "gadget", "tech", "electronic"],
  beauty: ["beauty", "makeup", "perfume", "skincare", "fragrance", "cosmetic"],
  other: [],
};

export interface FeedFilterState {
  category: FeedCategory;
  photos: {
    hasCaption: boolean;
    hasLocation: boolean;
    onlyFollowing: boolean;
    onlyWithComments: boolean;
  };
  music: {
    moods: MusicMood[];
    genres: MusicGenre[];
  };
  video: {
    moods: VideoMood[];
    genres: VideoGenre[];
  };
  shop: {
    types: ("auction" | "fixed")[];
    statuses: ("active" | "sold" | "ended")[];
    categories: ShopCategoryId[];
  };
}

export const DEFAULT_FILTER: FeedFilterState = {
  category: "all",
  photos: { hasCaption: false, hasLocation: false, onlyFollowing: false, onlyWithComments: false },
  music: { moods: [], genres: [] },
  video: { moods: [], genres: [] },
  shop: { types: ["auction", "fixed"], statuses: ["active"], categories: [] },
};

const CATS: { id: FeedCategory; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "music", label: "Music", icon: Music },
  { id: "video", label: "Video", icon: Video },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

const MUSIC_MOODS: { id: MusicMood; label: string; icon: any }[] = [
  { id: "new", label: "New releases", icon: Sparkles },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "throwback", label: "Throwbacks", icon: Disc3 },
];

const VIDEO_MOODS: { id: VideoMood; label: string; icon: any }[] = [
  { id: "new", label: "New", icon: Sparkles },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "shorts", label: "Shorts", icon: Film },
];

interface Props {
  value: FeedFilterState;
  onChange: (v: FeedFilterState) => void;
}

const isDefault = (f: FeedFilterState) =>
  f.category === "all" &&
  !f.photos.hasCaption && !f.photos.hasLocation && !f.photos.onlyFollowing && !f.photos.onlyWithComments &&
  f.music.moods.length === 0 && f.music.genres.length === 0 &&
  f.video.moods.length === 0 && f.video.genres.length === 0 &&
  f.shop.types.length === 2 && f.shop.statuses.length === 1 && f.shop.statuses[0] === "active" &&
  f.shop.categories.length === 0;

const FeedFilter = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const active = !isDefault(value);
  const activeCat = CATS.find((c) => c.id === value.category) ?? CATS[0];
  const ActiveIcon = activeCat.icon;

  const reset = () => onChange(DEFAULT_FILTER);

  function toggleArr<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pt-1 pb-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open feed filter"
          className={`w-full neo-button rounded-full px-4 h-9 flex items-center gap-2 text-xs font-semibold transition-colors ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          <span className={`neo-button-icon w-6 h-6 rounded-full flex items-center justify-center ${active ? "text-primary" : "text-muted-foreground"}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </span>
          <span className="uppercase tracking-wider">Filter</span>
          <span className="flex items-center gap-1 ml-1 text-muted-foreground normal-case tracking-normal">
            <ActiveIcon className="w-3.5 h-3.5" />
            <span className="text-[11px]">{activeCat.label}</span>
          </span>
          {active && (
            <span className="ml-auto flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] text-primary uppercase">Active</span>
            </span>
          )}
          <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 neo-card p-0 sm:max-w-lg sm:mx-auto sm:left-0 sm:right-0 sm:inset-x-0 flex flex-col max-h-[92dvh] h-[92dvh] sm:h-auto sm:max-h-[88dvh]"
        >
          <SheetHeader className="text-left space-y-1 px-5 pt-5 pb-3 shrink-0 border-b border-border/40">
            <SheetTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Filter your feed
            </SheetTitle>
            <SheetDescription className="text-xs">
              Pick a category, then narrow it down.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-6">
            {/* Categories */}
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Show me
              </p>
              <div className="grid grid-cols-5 gap-2">
                {CATS.map((c) => {
                  const Icon = c.icon;
                  const isActive = value.category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChange({ ...value, category: c.id })}
                      className={`rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-colors ${
                        isActive ? "neo-card-inset ring-1 ring-primary/40" : "neo-card"
                      }`}
                    >
                      <span className={`neo-button-icon w-9 h-9 rounded-full flex items-center justify-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Photos */}
            {(value.category === "all" || value.category === "photos") && (
              <SubSection title="Photos" icon={Camera}>
                <Toggle
                  icon={MessageSquare}
                  label="Only with captions"
                  desc="Skip image-only posts"
                  active={value.photos.hasCaption}
                  onClick={() => onChange({ ...value, photos: { ...value.photos, hasCaption: !value.photos.hasCaption } })}
                />
                <Toggle
                  icon={MapPin}
                  label="Only with location"
                  desc="Posts tagged with a place"
                  active={value.photos.hasLocation}
                  onClick={() => onChange({ ...value, photos: { ...value.photos, hasLocation: !value.photos.hasLocation } })}
                />
                <Toggle
                  icon={Heart}
                  label="People I follow"
                  desc="Hide everyone else"
                  active={value.photos.onlyFollowing}
                  onClick={() => onChange({ ...value, photos: { ...value.photos, onlyFollowing: !value.photos.onlyFollowing } })}
                />
                <Toggle
                  icon={MessageSquare}
                  label="Has comments"
                  desc="Conversations only"
                  active={value.photos.onlyWithComments}
                  onClick={() => onChange({ ...value, photos: { ...value.photos, onlyWithComments: !value.photos.onlyWithComments } })}
                />
              </SubSection>
            )}

            {/* Music */}
            {(value.category === "all" || value.category === "music") && (
              <SubSection title="Music" icon={Mic2}>
                <p className="text-[11px] text-muted-foreground -mb-1">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_MOODS.map((m) => (
                    <Chip
                      key={m.id}
                      icon={m.icon}
                      label={m.label}
                      active={value.music.moods.includes(m.id)}
                      onClick={() => onChange({ ...value, music: { ...value.music, moods: toggleArr(value.music.moods, m.id) } })}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 -mb-1">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_GENRES.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      active={value.music.genres.includes(g)}
                      onClick={() => onChange({ ...value, music: { ...value.music, genres: toggleArr(value.music.genres, g) } })}
                    />
                  ))}
                </div>
              </SubSection>
            )}

            {/* Video */}
            {(value.category === "all" || value.category === "video") && (
              <SubSection title="Video" icon={Film}>
                <p className="text-[11px] text-muted-foreground -mb-1">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_MOODS.map((m) => (
                    <Chip
                      key={m.id}
                      icon={m.icon}
                      label={m.label}
                      active={value.video.moods.includes(m.id)}
                      onClick={() => onChange({ ...value, video: { ...value.video, moods: toggleArr(value.video.moods, m.id) } })}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 -mb-1">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_GENRES.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      active={value.video.genres.includes(g)}
                      onClick={() => onChange({ ...value, video: { ...value.video, genres: toggleArr(value.video.genres, g) } })}
                    />
                  ))}
                </div>
              </SubSection>
            )}

            {/* Shop */}
            {(value.category === "all" || value.category === "shop") && (
              <SubSection title="Shop" icon={ShoppingBag}>
                <p className="text-[11px] text-muted-foreground -mb-1">Listing type</p>
                <div className="grid grid-cols-2 gap-2">
                  <Chip
                    icon={Gavel}
                    label="Auction"
                    active={value.shop.types.includes("auction")}
                    onClick={() => onChange({ ...value, shop: { ...value.shop, types: toggleArr(value.shop.types, "auction") } })}
                  />
                  <Chip
                    icon={Tag}
                    label="Fixed price"
                    active={value.shop.types.includes("fixed")}
                    onClick={() => onChange({ ...value, shop: { ...value.shop, types: toggleArr(value.shop.types, "fixed") } })}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 -mb-1">Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["active", "sold", "ended"] as const).map((s) => (
                    <Chip
                      key={s}
                      label={s[0].toUpperCase() + s.slice(1)}
                      active={value.shop.statuses.includes(s)}
                      onClick={() => onChange({ ...value, shop: { ...value.shop, statuses: toggleArr(value.shop.statuses, s) } })}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 -mb-1">Categories</p>
                <div className="grid grid-cols-3 gap-2">
                  {SHOP_CATEGORIES.map((c) => (
                    <Chip
                      key={c.id}
                      icon={c.icon}
                      label={c.label}
                      active={value.shop.categories.includes(c.id)}
                      onClick={() => onChange({ ...value, shop: { ...value.shop, categories: toggleArr(value.shop.categories, c.id) } })}
                    />
                  ))}
                </div>
              </SubSection>
            )}
          </div>

          <div className="shrink-0 border-t border-border/40 px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="neo-button rounded-full px-4 h-10 flex items-center gap-2 text-xs font-semibold"
            >
              <X className="w-4 h-4" /> Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 neo-button rounded-full h-10 text-xs font-semibold text-primary"
            >
              Apply
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const SubSection = ({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) => (
  <section className="space-y-2">
    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {title}
    </p>
    <div className="space-y-2">{children}</div>
  </section>
);

const Toggle = ({ icon: Icon, label, desc, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full neo-card rounded-2xl px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
      active ? "ring-1 ring-primary/40" : ""
    }`}
  >
    <span className={`neo-button-icon w-9 h-9 rounded-full flex items-center justify-center ${active ? "text-primary" : "text-muted-foreground"}`}>
      <Icon className="w-4 h-4" />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold truncate">{label}</span>
      <span className="block text-[11px] text-muted-foreground truncate">{desc}</span>
    </span>
    <span className={`w-10 h-6 rounded-full p-0.5 transition-colors ${active ? "bg-primary" : "neo-card-inset"}`}>
      <span className={`block w-5 h-5 rounded-full bg-background transition-transform ${active ? "translate-x-4" : ""}`} />
    </span>
  </button>
);

const Chip = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
      active ? "neo-card-inset text-primary ring-1 ring-primary/40" : "neo-card text-muted-foreground"
    }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

export { SHOP_KEYWORDS };
export default FeedFilter;
