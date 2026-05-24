import { AR_EFFECTS, AREffectPreset } from "@/lib/ar/arEffects";

interface Props {
  selectedId: string;
  onSelect: (e: AREffectPreset) => void;
}

/**
 * Horizontally swipeable carousel of AR face effects (glasses, crown, masks,
 * animated makeup). Thumbnails are emoji to keep payloads tiny — the actual
 * effect renders procedurally on the canvas.
 */
export const AREffectCarousel = ({ selectedId, onSelect }: Props) => (
  <div
    className="flex gap-2 overflow-x-auto px-3 py-2 snap-x snap-mandatory scrollbar-none"
    style={{ scrollbarWidth: "none" }}
    role="listbox"
    aria-label="AR face effects"
  >
    {AR_EFFECTS.map((e) => {
      const active = e.id === selectedId;
      return (
        <button
          key={e.id}
          onClick={() => onSelect(e)}
          className={`relative shrink-0 snap-center flex flex-col items-center gap-1 transition-transform ${
            active ? "scale-105" : "opacity-90 hover:opacity-100"
          }`}
          aria-pressed={active}
          aria-label={e.name}
          role="option"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ring-2 transition-all ${
              active
                ? "ring-primary shadow-lg bg-gradient-to-br from-primary/25 to-primary/5"
                : "ring-white/15 bg-white/5"
            }`}
          >
            <span aria-hidden>{e.thumb}</span>
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wide max-w-[64px] truncate ${
              active ? "text-primary" : "text-white/85"
            }`}
          >
            {e.name}
          </span>
        </button>
      );
    })}
  </div>
);

export default AREffectCarousel;
