import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Radio, UserPlus, Check, Camera, Hand, X } from "lucide-react";
import { LocationPicker } from "./LocationPicker";
import type { SavedLocation } from "@/lib/places";

// Live streaming mode for a story, with co-share (up to 10) and one-active-camera hand-off.
// Only one co-host's phone films at a time. Anyone in the roster can tap "Take camera"
// to stop the current filmer and broadcast from their handset.

type CoHost = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  muted: boolean;
};

const FRIEND_POOL: CoHost[] = [
  { id: "you",   name: "You",   avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop", color: "from-amber-400 to-orange-600", muted: false },
  { id: "maya",  name: "Maya",  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", color: "from-rose-400 to-fuchsia-600", muted: false },
  { id: "jonas", name: "Jonas", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", color: "from-sky-400 to-indigo-600", muted: false },
  { id: "rae",   name: "Rae",   avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", color: "from-emerald-400 to-teal-600", muted: true  },
  { id: "kofi",  name: "Kofi",  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", color: "from-violet-400 to-purple-600", muted: false },
  { id: "ines",  name: "Ines",  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", color: "from-pink-400 to-rose-600", muted: false },
  { id: "leo",   name: "Leo",   avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", color: "from-cyan-400 to-blue-600", muted: false },
  { id: "nia",   name: "Nia",   avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop", color: "from-lime-400 to-green-600", muted: false },
  { id: "tom",   name: "Tom",   avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop", color: "from-orange-400 to-red-600", muted: false },
  { id: "sara",  name: "Sara",  avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop", color: "from-yellow-400 to-amber-600", muted: false },
];

const MAX_COHOSTS = 10; // includes you

interface Props {
  onClose: () => void;
}

export default function LiveStreamMode({ onClose }: Props) {
  const [phase, setPhase] = useState<"invite" | "live">("invite");
  const [selected, setSelected] = useState<Set<string>>(new Set(["you"]));
  const [hosts, setHosts] = useState<CoHost[]>([]);
  const [filmerId, setFilmerId] = useState<string>("you");
  const [seconds, setSeconds] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Live timer
  useEffect(() => {
    if (phase !== "live") return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [phase]);

  // Simulated incoming "take camera" request
  useEffect(() => {
    if (phase !== "live") return;
    const t = setTimeout(() => {
      const candidate = hosts.find((h) => h.id !== filmerId && h.id !== "you");
      if (candidate) setRequestId(candidate.id);
    }, 6000);
    return () => clearTimeout(t);
  }, [phase, filmerId, hosts]);

  const toggleSelect = (id: string) => {
    if (id === "you") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_COHOSTS) next.add(id);
      return next;
    });
  };

  const goLive = () => {
    const chosen = FRIEND_POOL.filter((f) => selected.has(f.id));
    setHosts(chosen);
    setFilmerId("you");
    setSeconds(0);
    setPhase("live");
  };

  const takeCamera = (id: string) => {
    setFilmerId(id);
    setRequestId(null);
  };

  const toggleMute = (id: string) =>
    setHosts((hs) => hs.map((h) => (h.id === id ? { ...h, muted: !h.muted } : h)));

  const filmer = hosts.find((h) => h.id === filmerId);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ---------- Invite phase ----------
  if (phase === "invite") {
    return (
      <div className="space-y-4">
        <div className="neo-card-inset rounded-2xl p-4 text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Radio className="w-3.5 h-3.5" /> Co-share live
          </div>
          <p className="text-sm text-muted-foreground">
            Pick up to {MAX_COHOSTS - 1} friends to broadcast with you. Only one phone films at a
            time — anyone can take over with a tap.
          </p>
          <p className="text-[11px] font-semibold text-primary mt-2">
            {selected.size}/{MAX_COHOSTS} selected
          </p>
        </div>

        <div className="neo-card rounded-3xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
            Invite co-hosts
          </p>
          <div className="grid grid-cols-4 gap-3">
            {FRIEND_POOL.map((f) => {
              const isSel = selected.has(f.id);
              const isYou = f.id === "you";
              return (
                <button
                  key={f.id}
                  onClick={() => toggleSelect(f.id)}
                  disabled={isYou}
                  className="relative flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all ${
                      isSel ? "ring-2 ring-primary" : "neo-button-icon"
                    } ${isYou ? "opacity-100" : ""}`}
                  >
                    <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                    <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${f.color}`} />
                    {isSel && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold truncate max-w-full">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 neo-button rounded-2xl py-3 text-sm font-bold text-muted-foreground"
          >
            Cancel
          </button>
          <button
            onClick={goLive}
            className="flex-[2] bg-red-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <Radio className="w-4 h-4" /> Go live now
          </button>
        </div>
      </div>
    );
  }

  // ---------- Live phase ----------
  return (
    <div className="space-y-4">
      {/* Live header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest">
            Live · {hosts.length}/{MAX_COHOSTS}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{fmt(seconds)}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary/80">
          Co-shared story
        </span>
      </div>

      {/* Stage */}
      <div className="relative rounded-3xl overflow-hidden neo-card-inset aspect-[3/4] max-h-[420px] bg-black">
        {filmer && (
          <AnimatePresence mode="wait">
            <motion.div
              key={filmer.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={filmer.avatar}
                alt={filmer.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-xs font-semibold bg-red-500/90 px-2.5 py-1 rounded-full">
                  <Camera className="w-3.5 h-3.5" />
                  Filming · @{filmer.name.toLowerCase()}
                </div>
                {filmer.muted && (
                  <span className="bg-black/50 backdrop-blur px-2 py-1 rounded-full text-[10px] flex items-center gap-1">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Incoming "take camera" request */}
        <AnimatePresence>
          {requestId && (() => {
            const r = hosts.find((h) => h.id === requestId);
            if (!r) return null;
            return (
              <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                className="absolute top-12 left-3 right-3 bg-background/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl"
              >
                <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">@{r.name.toLowerCase()}</p>
                  <p className="text-[10px] text-muted-foreground">wants to take the camera</p>
                </div>
                <button
                  onClick={() => setRequestId(null)}
                  className="neo-button-icon w-8 h-8 rounded-full flex items-center justify-center"
                  aria-label="Decline"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => takeCamera(r.id)}
                  className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-full"
                >
                  Hand over
                </button>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Roster — tap any to take the camera */}
      <div className="neo-card rounded-3xl p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Roster · tap to take camera
          </p>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Hand className="w-3 h-3" /> One filmer at a time
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: MAX_COHOSTS }).map((_, i) => {
            const h = hosts[i];
            if (!h) {
              return (
                <div
                  key={i}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/50"
                >
                  <UserPlus className="w-4 h-4" />
                </div>
              );
            }
            const isFilming = h.id === filmerId;
            return (
              <div key={h.id} className="relative">
                <button
                  onClick={() => takeCamera(h.id)}
                  className={`relative w-full aspect-square rounded-2xl overflow-hidden transition-all ${
                    isFilming ? "ring-2 ring-red-500" : "neo-button-icon"
                  }`}
                  aria-label={`Take camera from ${h.name}`}
                >
                  <img src={h.avatar} alt={h.name} className="w-full h-full object-cover" />
                  <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${h.color}`} />
                  {isFilming && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Camera className="w-2.5 h-2.5" /> LIVE
                    </div>
                  )}
                </button>
                <button
                  onClick={() => toggleMute(h.id)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background neo-button-icon flex items-center justify-center"
                  aria-label={h.muted ? "Unmute" : "Mute"}
                >
                  {h.muted ? (
                    <MicOff className="w-3 h-3 text-destructive" />
                  ) : (
                    <Mic className="w-3 h-3 text-primary" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Take-camera CTA when not filming */}
      {filmerId !== "you" && (
        <button
          onClick={() => takeCamera("you")}
          className="w-full neo-button rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold text-primary active:scale-[0.98] transition-transform"
        >
          <Camera className="w-4 h-4" /> Film from my phone
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full bg-red-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-[0.98] transition-transform"
      >
        <Radio className="w-4 h-4" /> End live for everyone
      </button>
    </div>
  );
}
