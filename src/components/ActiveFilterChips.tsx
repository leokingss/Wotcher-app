import { X, Gavel, Sparkles } from "lucide-react";
import { FeedFilterState, DEFAULT_FILTER } from "./FeedFilter";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Props {
  value: FeedFilterState;
  onChange: (v: FeedFilterState) => void;
}

const ActiveFilterChips = ({ value, onChange }: Props) => {
  const chips: Chip[] = [];

  // Photos refine toggles
  if (value.photos.hasCaption) chips.push({ key: "p-cap", label: "Has caption", onRemove: () => onChange({ ...value, photos: { ...value.photos, hasCaption: false } }) });
  if (value.photos.hasLocation) chips.push({ key: "p-loc", label: "Has location", onRemove: () => onChange({ ...value, photos: { ...value.photos, hasLocation: false } }) });
  if (value.photos.onlyFollowing) chips.push({ key: "p-fol", label: "Following", onRemove: () => onChange({ ...value, photos: { ...value.photos, onlyFollowing: false } }) });
  if (value.photos.onlyWithComments) chips.push({ key: "p-com", label: "Has comments", onRemove: () => onChange({ ...value, photos: { ...value.photos, onlyWithComments: false } }) });

  // Music
  value.music.moods.forEach((m) => chips.push({ key: `mm-${m}`, label: m, onRemove: () => onChange({ ...value, music: { ...value.music, moods: value.music.moods.filter((x) => x !== m) } }) }));
  value.music.genres.forEach((g) => chips.push({ key: `mg-${g}`, label: g, onRemove: () => onChange({ ...value, music: { ...value.music, genres: value.music.genres.filter((x) => x !== g) } }) }));

  // Video
  value.video.moods.forEach((m) => chips.push({ key: `vm-${m}`, label: m, onRemove: () => onChange({ ...value, video: { ...value.video, moods: value.video.moods.filter((x) => x !== m) } }) }));
  value.video.genres.forEach((g) => chips.push({ key: `vg-${g}`, label: g, onRemove: () => onChange({ ...value, video: { ...value.video, genres: value.video.genres.filter((x) => x !== g) } }) }));

  // Shop
  if (value.shop.liveAuctionsOnly) chips.push({ key: "s-live", label: "Live auctions", icon: Radio, onRemove: () => onChange({ ...value, shop: { ...value.shop, liveAuctionsOnly: false, types: ["auction", "fixed"] } }) });
  if (value.shop.types.length !== 2) {
    value.shop.types.forEach((t) => chips.push({
      key: `st-${t}`,
      label: t === "auction" ? "Auction" : "Fixed price",
      icon: t === "auction" ? Gavel : undefined,
      onRemove: () => onChange({ ...value, shop: { ...value.shop, types: value.shop.types.filter((x) => x !== t).length ? value.shop.types.filter((x) => x !== t) : ["auction", "fixed"] } }),
    }));
  }
  if (value.shop.statuses.length !== 1 || value.shop.statuses[0] !== "active") {
    value.shop.statuses.forEach((s) => chips.push({
      key: `ss-${s}`,
      label: s[0].toUpperCase() + s.slice(1),
      onRemove: () => onChange({ ...value, shop: { ...value.shop, statuses: value.shop.statuses.filter((x) => x !== s).length ? value.shop.statuses.filter((x) => x !== s) : ["active"] } }),
    }));
  }
  value.shop.categories.forEach((c) => chips.push({ key: `sc-${c}`, label: c[0].toUpperCase() + c.slice(1), onRemove: () => onChange({ ...value, shop: { ...value.shop, categories: value.shop.categories.filter((x) => x !== c) } }) }));


  if (chips.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
      {chips.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.key}
            onClick={c.onRemove}
            className="shrink-0 neo-card-inset rounded-full pl-3 pr-2 h-8 flex items-center gap-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30"
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {c.label}
            <X className="w-3.5 h-3.5 opacity-70" />
          </button>
        );
      })}
      {chips.length > 0 && (
        <button
          onClick={() => onChange(DEFAULT_FILTER)}
          className="shrink-0 ml-auto text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
