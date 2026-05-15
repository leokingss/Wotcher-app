import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Users, Play } from "lucide-react";

// "Perspective Moments" — one event, multiple cameras, auto-collaged.
// Friends at the same event/time auto-bundle into a single multi-cam story.
const ANGLES = [
  { id: "a", user: "maya", color: "from-amber-400 to-rose-500", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop", label: "Front row" },
  { id: "b", user: "jonas", color: "from-cyan-400 to-blue-600", img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=600&fit=crop", label: "Back of crowd" },
  { id: "c", user: "rae", color: "from-violet-400 to-fuchsia-600", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=600&fit=crop", label: "Side stage" },
  { id: "d", user: "kofi", color: "from-emerald-400 to-teal-600", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop", label: "Balcony" },
];

export default function PerspectiveMoments() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setActive((i) => (i + 1) % ANGLES.length), 1800);
    return () => clearInterval(t);
  }, [playing]);

  const a = ANGLES[active];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>4 friends captured this moment</span>
        <span className="text-xs">· Brixton Academy · 23:14</span>
      </div>

      <div className="relative aspect-[9/14] max-h-[460px] rounded-3xl overflow-hidden neo-card-inset">
        <AnimatePresence mode="wait">
          <motion.img
            key={a.id}
            src={a.img}
            alt={a.label}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* progress segments */}
        <div className="absolute top-3 left-3 right-3 flex gap-1.5">
          {ANGLES.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: i < active ? "100%" : i === active ? "100%" : "0%" }}
                transition={{ duration: i === active ? 1.6 : 0.2 }}
              />
            </div>
          ))}
        </div>

        {/* angle badge */}
        <div className="absolute top-8 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 text-xs font-semibold drop-shadow">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-[10px] uppercase`}>
              {a.user[0]}
            </div>
            @{a.user}
          </div>
          <span className="text-[10px] uppercase tracking-widest bg-black/40 backdrop-blur px-2 py-1 rounded-full">{a.label}</span>
        </div>

        {/* angle picker */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
          {ANGLES.map((ang, i) => (
            <button
              key={ang.id}
              onClick={() => { setActive(i); setPlaying(false); }}
              className={`relative w-12 h-16 rounded-xl overflow-hidden transition-all ${
                i === active ? "ring-2 ring-white scale-105" : "opacity-60"
              }`}
              aria-label={`Angle ${ang.label}`}
            >
              <img src={ang.img} alt="" className="w-full h-full object-cover" />
              <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${ang.color}`} />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setPlaying((p) => !p)}
        className="w-full neo-button-icon py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
      >
        {playing ? <Camera className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {playing ? "Auto-cycling angles" : "Resume auto-cut"}
      </button>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        When friends post within minutes of each other at the same place, Watcher bundles their clips into one shared, multi-angle moment. Tap a thumbnail to switch perspective. No other app does this.
      </p>
    </div>
  );
}
