import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { FILTER_PRESETS, FilterPreset } from "@/lib/storyFilters";

interface FilterCarouselProps {
  /** Static thumbnail (image URL) used as preview. */
  previewSrc?: string;
  selectedId: string;
  onSelect: (preset: FilterPreset) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

/**
 * Horizontal swipeable carousel of filter thumbnails. Each thumbnail shows
 * a tiny version of the user's media with the filter applied so they can
 * preview every look at a glance.
 */
export const FilterCarousel = ({
  previewSrc,
  selectedId,
  onSelect,
  favorites,
  onToggleFavorite,
}: FilterCarouselProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Centre the selected thumbnail in view as the user swipes through.
  useEffect(() => {
    const el = trackRef.current?.querySelector<HTMLButtonElement>(
      `[data-filter-id="${selectedId}"]`,
    );
    el?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  return (
    <div
      ref={trackRef}
      className="flex gap-2 overflow-x-auto px-3 py-2 snap-x snap-mandatory scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {FILTER_PRESETS.map((p) => {
        const active = p.id === selectedId;
        const fav = favorites?.has(p.id);
        return (
          <button
            key={p.id}
            data-filter-id={p.id}
            onClick={() => onSelect(p)}
            className={`relative shrink-0 snap-center flex flex-col items-center gap-1 transition-transform ${
              active ? "scale-105" : "opacity-90 hover:opacity-100"
            }`}
            aria-pressed={active}
            aria-label={p.name}
          >
            <div
              className={`relative w-14 h-14 rounded-2xl overflow-hidden ring-2 transition-all ${
                active ? "ring-primary shadow-lg" : "ring-white/15"
              }`}
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: p.cssFilter }}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(135deg,#3a3a3a,#1a1a1a 60%,#000)",
                    filter: p.cssFilter,
                  }}
                />
              )}
              {p.tint && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: p.tint.color,
                    opacity: p.tint.opacity,
                    mixBlendMode: p.tint.blend ?? "soft-light",
                  }}
                />
              )}
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(p.id);
                  }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/40 backdrop-blur-sm"
                  aria-label={fav ? "Unfavourite filter" : "Favourite filter"}
                >
                  <Star
                    className={`w-3 h-3 ${fav ? "fill-yellow-400 text-yellow-400" : "text-white"}`}
                  />
                </button>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold tracking-wide max-w-[64px] truncate ${
                active ? "text-primary" : "text-white/85"
              }`}
            >
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FilterCarousel;
