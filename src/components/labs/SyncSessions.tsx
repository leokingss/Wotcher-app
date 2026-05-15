import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Plus, Heart, MessageCircle } from "lucide-react";

// "Sync Sessions" — live shared listening room. Hit play together, react in real time.
const PARTICIPANTS = [
  { id: "you", name: "You", color: "from-amber-400 to-orange-600", host: true },
  { id: "maya", name: "Maya", color: "from-rose-400 to-fuchsia-600" },
  { id: "jonas", name: "Jonas", color: "from-sky-400 to-indigo-600" },
  { id: "rae", name: "Rae", color: "from-emerald-400 to-teal-600" },
];

const REACTIONS = ["🔥", "💀", "❤️", "🤯", "🎯"];

const TRACK = {
  title: "Glass Skin",
  artist: "Vega Rin",
  cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  duration: 212,
};

type Bubble = { id: number; user: string; emoji: string; x: number };

export default function SyncSessions() {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(47);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setT((s) => (s >= TRACK.duration ? 0 : s + 1)), 1000);
    return () => clearInterval(i);
  }, [playing]);

  // Simulated incoming reactions
  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => {
      const u = PARTICIPANTS[1 + Math.floor(Math.random() * 3)];
      const e = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      const id = ++idRef.current;
      setBubbles((b) => [...b, { id, user: u.name, emoji: e, x: 10 + Math.random() * 80 }]);
      setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== id)), 2500);
    }, 1600);
    return () => clearInterval(i);
  }, [playing]);

  const sendReaction = (emoji: string) => {
    const id = ++idRef.current;
    setBubbles((b) => [...b, { id, user: "You", emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== id)), 2500);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const progress = (t / TRACK.duration) * 100;

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest">Live · 4 listening</span>
        </div>
        <button className="text-xs text-primary font-semibold flex items-center gap-1">
          <Plus className="w-3 h-3" /> Invite
        </button>
      </div>

      {/* Stage */}
      <div className="relative neo-card p-5 rounded-3xl overflow-hidden">
        <div className="flex items-center gap-4">
          <motion.img
            src={TRACK.cover}
            alt={TRACK.title}
            animate={{ rotate: playing ? 360 : 0 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-background shadow-xl"
          />
          <div className="min-w-0">
            <p className="font-bold truncate">{TRACK.title}</p>
            <p className="text-sm text-muted-foreground truncate">{TRACK.artist}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] tabular-nums text-muted-foreground">{fmt(t)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-amber-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{fmt(TRACK.duration)}</span>
            </div>
          </div>
        </div>

        {/* Reaction bubbles */}
        <div className="relative h-28 mt-3 overflow-hidden">
          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.div
                key={b.id}
                initial={{ y: 100, opacity: 0, scale: 0.6 }}
                animate={{ y: -20, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 2.4, ease: "easeOut" }}
                className="absolute bottom-0 flex flex-col items-center gap-0.5"
                style={{ left: `${b.x}%` }}
              >
                <span className="text-2xl drop-shadow">{b.emoji}</span>
                <span className="text-[9px] font-semibold text-muted-foreground">{b.user}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Participants */}
        <div className="flex -space-x-2 justify-center">
          {PARTICIPANTS.map((p) => (
            <div key={p.id} className="relative">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-xs font-bold text-white ring-2 ring-background`}>
                {p.name[0]}
              </div>
              {p.host && (
                <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-primary text-primary-foreground rounded-full px-1">DJ</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {REACTIONS.map((e) => (
          <button
            key={e}
            onClick={() => sendReaction(e)}
            className="neo-button-icon w-11 h-11 rounded-full flex items-center justify-center text-xl active:scale-90 transition-transform"
            aria-label={`React ${e}`}
          >
            {e}
          </button>
        ))}
      </div>

      <button
        onClick={() => setPlaying((p) => !p)}
        className="w-full neo-button-icon py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-primary"
      >
        {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        {playing ? "Pause for everyone" : "Play together"}
      </button>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        Drop a track and your friends hear the exact same beat at the exact same second. Reactions float up live. The room is the experience — not the algorithm.
      </p>
    </div>
  );
}
