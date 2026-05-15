import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, CloudRain, CloudLightning, Sparkles } from "lucide-react";

// "Vibe Weather" — your social feed has a weather report.
// Aggregates tone (energy, melancholy, hype, calm) of the people you follow into a forecast.
type Vibe = {
  id: string;
  label: string;
  emoji: string;
  pct: number;
  color: string;
  Icon: typeof Sun;
};

const HOURS = ["Now", "+1h", "+3h", "Tonight", "Tomorrow"];

const PRESETS: Vibe[][] = [
  [
    { id: "sun", label: "Sunny hype", emoji: "☀️", pct: 58, color: "from-amber-300 to-orange-500", Icon: Sun },
    { id: "cloud", label: "Soft mood", emoji: "🌤", pct: 24, color: "from-sky-300 to-indigo-400", Icon: Cloud },
    { id: "rain", label: "Melancholy", emoji: "🌧", pct: 12, color: "from-slate-400 to-blue-700", Icon: CloudRain },
    { id: "storm", label: "Drama", emoji: "⚡️", pct: 6, color: "from-fuchsia-500 to-rose-600", Icon: CloudLightning },
  ],
  [
    { id: "sun", label: "Sunny hype", emoji: "☀️", pct: 30, color: "from-amber-300 to-orange-500", Icon: Sun },
    { id: "cloud", label: "Soft mood", emoji: "🌤", pct: 45, color: "from-sky-300 to-indigo-400", Icon: Cloud },
    { id: "rain", label: "Melancholy", emoji: "🌧", pct: 18, color: "from-slate-400 to-blue-700", Icon: CloudRain },
    { id: "storm", label: "Drama", emoji: "⚡️", pct: 7, color: "from-fuchsia-500 to-rose-600", Icon: CloudLightning },
  ],
  [
    { id: "sun", label: "Sunny hype", emoji: "☀️", pct: 18, color: "from-amber-300 to-orange-500", Icon: Sun },
    { id: "cloud", label: "Soft mood", emoji: "🌤", pct: 32, color: "from-sky-300 to-indigo-400", Icon: Cloud },
    { id: "rain", label: "Melancholy", emoji: "🌧", pct: 38, color: "from-slate-400 to-blue-700", Icon: CloudRain },
    { id: "storm", label: "Drama", emoji: "⚡️", pct: 12, color: "from-fuchsia-500 to-rose-600", Icon: CloudLightning },
  ],
  [
    { id: "sun", label: "Sunny hype", emoji: "☀️", pct: 22, color: "from-amber-300 to-orange-500", Icon: Sun },
    { id: "cloud", label: "Soft mood", emoji: "🌤", pct: 28, color: "from-sky-300 to-indigo-400", Icon: Cloud },
    { id: "rain", label: "Melancholy", emoji: "🌧", pct: 22, color: "from-slate-400 to-blue-700", Icon: CloudRain },
    { id: "storm", label: "Drama", emoji: "⚡️", pct: 28, color: "from-fuchsia-500 to-rose-600", Icon: CloudLightning },
  ],
  [
    { id: "sun", label: "Sunny hype", emoji: "☀️", pct: 48, color: "from-amber-300 to-orange-500", Icon: Sun },
    { id: "cloud", label: "Soft mood", emoji: "🌤", pct: 30, color: "from-sky-300 to-indigo-400", Icon: Cloud },
    { id: "rain", label: "Melancholy", emoji: "🌧", pct: 14, color: "from-slate-400 to-blue-700", Icon: CloudRain },
    { id: "storm", label: "Drama", emoji: "⚡️", pct: 8, color: "from-fuchsia-500 to-rose-600", Icon: CloudLightning },
  ],
];

export default function VibeWeather() {
  const [hour, setHour] = useState(0);
  const vibes = PRESETS[hour];
  const dominant = useMemo(() => [...vibes].sort((a, b) => b.pct - a.pct)[0], [vibes]);

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className={`relative rounded-3xl p-5 overflow-hidden neo-card`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${dominant.color} opacity-25`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your circle's vibe</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl">{dominant.emoji}</span>
              <div>
                <p className="text-2xl font-bold leading-none">{dominant.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{dominant.pct}% of recent posts</p>
              </div>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        {/* stacked bar */}
        <div className="relative mt-5 h-3 rounded-full overflow-hidden flex bg-muted/40">
          {vibes.map((v) => (
            <motion.div
              key={v.id}
              animate={{ width: `${v.pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`h-full bg-gradient-to-r ${v.color}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {vibes.map((v) => (
            <span key={v.id}>{v.emoji} {v.pct}%</span>
          ))}
        </div>
      </div>

      {/* forecast strip */}
      <div className="grid grid-cols-5 gap-2">
        {HOURS.map((h, i) => {
          const top = [...PRESETS[i]].sort((a, b) => b.pct - a.pct)[0];
          const Ico = top.Icon;
          const active = i === hour;
          return (
            <button
              key={h}
              onClick={() => setHour(i)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${
                active ? "neo-card-inset text-primary" : "neo-button-icon"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{h}</span>
              <Ico className="w-5 h-5" />
              <span className="text-[10px] font-bold">{top.pct}%</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        We read the emotional tone of posts from people you follow and forecast the next 24 hours. Walk into your feed knowing what the room feels like.
      </p>
    </div>
  );
}
