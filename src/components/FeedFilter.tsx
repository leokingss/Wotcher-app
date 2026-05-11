import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  SlidersHorizontal, ChevronDown, Layers, Image as ImageIcon, Music,
  Video, ShoppingBag, MapPin, MessageSquare, Gavel, Tag, X,
} from "lucide-react";

export type FeedCategory = "all" | "posts" | "music" | "video" | "shop";

export interface FeedFilterState {
  category: FeedCategory;
  posts: { hasCaption: boolean; hasLocation: boolean };
  music: { onlyTracks: boolean };
  video: { onlyVideos: boolean };
  shop: {
    types: ("auction" | "fixed")[];
    statuses: ("active" | "sold" | "ended")[];
  };
}

export const DEFAULT_FILTER: FeedFilterState = {
  category: "all",
  posts: { hasCaption: false, hasLocation: false },
  music: { onlyTracks: true },
  video: { onlyVideos: true },
  shop: { types: ["auction", "fixed"], statuses: ["active"] },
};

const CATS: { id: FeedCategory; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "posts", label: "Posts", icon: ImageIcon },
  { id: "music", label: "Music", icon: Music },
  { id: "video", label: "Video", icon: Video },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

interface Props {
  value: FeedFilterState;
  onChange: (v: FeedFilterState) => void;
}

const isDefault = (f: FeedFilterState) =>
  f.category === "all" &&
  !f.posts.hasCaption && !f.posts.hasLocation &&
  f.shop.types.length === 2 && f.shop.statuses.length === 1 && f.shop.statuses[0] === "active";

const FeedFilter = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const active = !isDefault(value);
  const activeCat = CATS.find((c) => c.id === value.category) ?? CATS[0];
  const ActiveIcon = activeCat.icon;

  const reset = () => onChange(DEFAULT_FILTER);

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

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
          <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${active ? "" : ""}`} />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 neo-card p-0 sm:max-w-lg sm:mx-auto sm:left-0 sm:right-0 sm:inset-x-0 flex flex-col max-h-[90dvh] h-[90dvh] sm:h-auto sm:max-h-[85dvh]"
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

            {/* Sub-filters per category */}
            {(value.category === "all" || value.category === "posts") && (
              <SubSection title="Posts">
                <Toggle
                  icon={MessageSquare}
                  label="Only with captions"
                  desc="Skip image-only posts"
                  active={value.posts.hasCaption}
                  onClick={() => onChange({ ...value, posts: { ...value.posts, hasCaption: !value.posts.hasCaption } })}
                />
                <Toggle
                  icon={MapPin}
                  label="Only with location"
                  desc="Posts tagged with a place"
                  active={value.posts.hasLocation}
                  onClick={() => onChange({ ...value, posts: { ...value.posts, hasLocation: !value.posts.hasLocation } })}
                />
              </SubSection>
            )}

            {(value.category === "all" || value.category === "music") && (
              <SubSection title="Music">
                <Toggle
                  icon={Music}
                  label="Only music posts"
                  desc="Tracks, releases, audio uploads"
                  active={value.music.onlyTracks}
                  onClick={() => onChange({ ...value, music: { onlyTracks: !value.music.onlyTracks } })}
                />
              </SubSection>
            )}

            {(value.category === "all" || value.category === "video") && (
              <SubSection title="Video">
                <Toggle
                  icon={Video}
                  label="Only video posts"
                  desc="Clips & uploads"
                  active={value.video.onlyVideos}
                  onClick={() => onChange({ ...value, video: { onlyVideos: !value.video.onlyVideos } })}
                />
              </SubSection>
            )}

            {(value.category === "all" || value.category === "shop") && (
              <SubSection title="Shop">
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

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
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

export default FeedFilter;
