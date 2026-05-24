import { Sparkle } from "lucide-react";
import type { BeautyParams } from "@/lib/beauty/BeautyEngine";

interface BeautyPanelProps {
  params: BeautyParams;
  onChange: (next: BeautyParams) => void;
  onReset?: () => void;
}

const ROWS: { key: keyof BeautyParams; label: string; hint: string }[] = [
  { key: "skinSmooth", label: "Skin smooth", hint: "Soften skin texture" },
  { key: "eyeBrighten", label: "Eye brighten", hint: "Lift eye whites & catchlight" },
  { key: "teethWhiten", label: "Teeth whiten", hint: "Brighten teeth" },
  { key: "contour", label: "Soft contour", hint: "Subtle cheek definition" },
];

/**
 * Slider stack for the four beauty effects. All sliders default to 0 — beauty
 * is strictly opt-in.
 */
export const BeautyPanel = ({ params, onChange, onReset }: BeautyPanelProps) => {
  const set = (key: keyof BeautyParams, value: number) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="px-3 py-3 space-y-3 text-white/90">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          <Sparkle className="w-4 h-4 text-primary" aria-hidden />
          Beauty
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-[10px] font-semibold text-white/60 hover:text-white"
          >
            Reset
          </button>
        )}
      </div>
      {ROWS.map((r) => (
        <label key={r.key} className="block">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-medium">{r.label}</span>
            <span className="tabular-nums text-white/70">
              {Math.round(params[r.key])}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={params[r.key]}
            onChange={(e) => set(r.key, Number(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-full accent-primary"
            aria-label={r.label}
          />
          <span className="sr-only">{r.hint}</span>
        </label>
      ))}
    </div>
  );
};

export default BeautyPanel;
