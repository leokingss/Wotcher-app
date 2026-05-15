import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Star, UserPlus, Radio, X } from "lucide-react";

// "Live Together" — up to 10 friends co-host a single live story, picture-in-picture style.
// Host can spotlight any guest as the main view; others appear as tiles around it.

type Guest = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  muted: boolean;
  joined: boolean;
};

const POOL: Guest[] = [
  { id: "you", name: "You", avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop", color: "from-amber-400 to-orange-600", muted: false, joined: true },
  { id: "maya", name: "Maya", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", color: "from-rose-400 to-fuchsia-600", muted: false, joined: true },
  { id: "jonas", name: "Jonas", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", color: "from-sky-400 to-indigo-600", muted: false, joined: true },
  { id: "rae", name: "Rae", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", color: "from-emerald-400 to-teal-600", muted: true, joined: true },
  { id: "kofi", name: "Kofi", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", color: "from-violet-400 to-purple-600", muted: false, joined: true },
  { id: "ines", name: "Ines", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", color: "from-pink-400 to-rose-600", muted: false, joined: true },
  { id: "leo", name: "Leo", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", color: "from-cyan-400 to-blue-600", muted: true, joined: false },
  { id: "nia", name: "Nia", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop", color: "from-lime-400 to-green-600", muted: false, joined: false },
  { id: "tom", name: "Tom", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop", color: "from-orange-400 to-red-600", muted: false, joined: false },
  { id: "sara", name: "Sara", avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop", color: "from-yellow-400 to-amber-600", muted: false, joined: false },
];

const MAX_GUESTS = 10;

export default function LiveTogether() {
  const [guests, setGuests] = useState<Guest[]>(POOL);
  const [spotlightId, setSpotlightId] = useState("you");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Simulated incoming join request after 4s
  useEffect(() => {
    const t = setTimeout(() => {
      const next = guests.find((g) => !g.joined);
      if (next) setPendingId(next.id);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const joined = guests.filter((g) => g.joined);
  const spotlight = joined.find((g) => g.id === spotlightId) ?? joined[0];
  const tiles = joined.filter((g) => g.id !== spotlight?.id);
  const pending = guests.find((g) => g.id === pendingId);

  const toggleMute = (id: string) =>
    setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, muted: !g.muted } : g)));
  const accept = () => {
    if (!pending) return;
    setGuests((gs) => gs.map((g) => (g.id === pending.id ? { ...g, joined: true } : g)));
    setPendingId(null);
  };
  const decline = () => setPendingId(null);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest">Live · {joined.length}/{MAX_GUESTS}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{fmt(seconds)}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary/80">Co-host story</span>
      </div>

      {/* Stage: spotlight + tile strip */}
      <div className="relative rounded-3xl overflow-hidden neo-card-inset aspect-[3/4] max-h-[480px]">
        {spotlight && (
          <AnimatePresence mode="wait">
            <motion.div
              key={spotlight.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img src={spotlight.avatar} alt={spotlight.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  Spotlight · @{spotlight.name.toLowerCase()}
                </div>
                {spotlight.muted && (
                  <span className="bg-black/50 backdrop-blur px-2 py-1 rounded-full text-[10px] flex items-center gap-1">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Tile strip */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {tiles.map((g) => (
            <button
              key={g.id}
              onClick={() => setSpotlightId(g.id)}
              className="relative shrink-0 w-16 h-20 rounded-xl overflow-hidden ring-2 ring-white/40 hover:ring-white transition-all"
              aria-label={`Spotlight ${g.name}`}
            >
              <img src={g.avatar} alt={g.name} className="w-full h-full object-cover" />
              <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${g.color}`} />
              <div className="absolute top-1 right-1">
                {g.muted ? (
                  <MicOff className="w-3 h-3 text-white drop-shadow" />
                ) : (
                  <Mic className="w-3 h-3 text-emerald-300 drop-shadow" />
                )}
              </div>
              <div className="absolute bottom-1 left-1 text-[9px] font-bold text-white drop-shadow">
                {g.name}
              </div>
            </button>
          ))}
        </div>

        {/* Incoming request toast */}
        <AnimatePresence>
          {pending && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="absolute top-12 left-3 right-3 bg-background/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl"
            >
              <img src={pending.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">@{pending.name.toLowerCase()}</p>
                <p className="text-[10px] text-muted-foreground">wants to join your live</p>
              </div>
              <button onClick={decline} className="neo-button-icon w-8 h-8 rounded-full flex items-center justify-center" aria-label="Decline">
                <X className="w-4 h-4" />
              </button>
              <button onClick={accept} className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-full">
                Add
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roster controls */}
      <div className="neo-card rounded-3xl p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Roster</p>
          <button
            onClick={() => {
              const next = guests.find((g) => !g.joined);
              if (next && joined.length < MAX_GUESTS) setPendingId(next.id);
            }}
            disabled={joined.length >= MAX_GUESTS}
            className="text-xs text-primary font-semibold flex items-center gap-1 disabled:opacity-40"
          >
            <UserPlus className="w-3 h-3" /> Invite friend
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: MAX_GUESTS }).map((_, i) => {
            const g = joined[i];
            if (!g) {
              return (
                <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/50">
                  <UserPlus className="w-4 h-4" />
                </div>
              );
            }
            const isSpot = g.id === spotlight?.id;
            return (
              <div key={g.id} className="relative">
                <button
                  onClick={() => setSpotlightId(g.id)}
                  className={`relative w-full aspect-square rounded-2xl overflow-hidden ${
                    isSpot ? "ring-2 ring-primary" : "neo-button-icon"
                  }`}
                >
                  <img src={g.avatar} alt={g.name} className="w-full h-full object-cover" />
                  <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${g.color}`} />
                </button>
                <button
                  onClick={() => toggleMute(g.id)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background neo-button-icon flex items-center justify-center"
                  aria-label={g.muted ? "Unmute" : "Mute"}
                >
                  {g.muted ? <MicOff className="w-3 h-3 text-destructive" /> : <Mic className="w-3 h-3 text-primary" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button className="w-full bg-red-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-[0.98] transition-transform">
        <Radio className="w-4 h-4" /> End live for everyone
      </button>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        Up to 10 friends co-host a single live story. Anyone can request to join, the host taps Add, and they pop into the roster. Tap any tile to spotlight that camera as the main view — perfect for trips, parties, and watch-alongs.
      </p>
    </div>
  );
}
