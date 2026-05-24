import { Sparkles } from "lucide-react";

interface IntensitySliderProps {
  value: number; // 0..100
  onChange: (v: number) => void;
}

/** Glassy slider for tweaking filter strength. */
export const IntensitySlider = ({ value, onChange }: IntensitySliderProps) => (
  <div className="flex items-center gap-3 text-white/90">
    <Sparkles className="w-4 h-4 text-primary" aria-hidden />
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1 bg-white/20 rounded-full accent-primary"
      aria-label="Filter intensity"
    />
    <span className="text-xs font-semibold tabular-nums w-9 text-right">
      {Math.round(value)}
    </span>
  </div>
);

export default IntensitySlider;
