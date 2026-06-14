import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Radio, Gavel, Music2, Coffee, Map as MapIcon, Layers } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useLive } from "@/hooks/useLiveStore";

import LiveBadge from "@/components/live/LiveBadge";
import AuctionsLane from "@/components/live/AuctionsLane";

type TabId = "all" | "auction" | "hangout" | "sync" | "map";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "auction", label: "Auctions", icon: Gavel },
  { id: "hangout", label: "Hangouts", icon: Coffee },
  { id: "sync", label: "Sync", icon: Music2 },
  { id: "map", label: "Map", icon: MapIcon },
];

// Bento tile size pattern — drives the TV-wall mosaic feel
const SIZE_PATTERN = [
  "col-span-2 row-span-2", // big
  "col-span-1 row-span-1",
  "col-span-1 row-span-2", // tall
  "col-span-2 row-span-1", // wide
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-2",
];

const KIND_LABEL: Record<string, string> = {
  auction: "Auction",
  sync: "Sync",
  together: "Hangout",
};

const LiveIndex = () => {
  const { rooms, feed } = useLive();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    if (tab === "all" || tab === "map") return rooms;
    if (tab === "hangout") return rooms.filter((r) => r.kind === "together");
    return rooms.filter((r) => r.kind === tab);
  }, [rooms, tab]);

  const goNext = () => {
    const i = TABS.findIndex((t) => t.id === tab);
    setTab(TABS[Math.min(TABS.length - 1, i + 1)].id);
  };
  const goPrev = () => {
    const i = TABS.findIndex((t) => t.id === tab);
    setTab(TABS[Math.max(0, i - 1)].id);
  };

  const onDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
  };

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-destructive animate-pulse" /> Live now
          </h1>
          <div className="w-9" />
        </div>

        {/* Tab bar — swipeable */}
        <div className="max-w-lg mx-auto px-3 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? "neo-card-inset text-primary"
                    : "neo-button-icon text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={tab}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
          className="max-w-lg mx-auto px-3 pt-2 touch-pan-y"
        >
          {tab === "map" ? (
            <LiveMap rooms={rooms} />
          ) : tab === "auction" ? (
            <AuctionsLane liveRooms={rooms.filter((r) => r.kind === "auction")} />
          ) : (
            <TvWall rooms={filtered} feed={feed} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

/* ------------------------- TV WALL ------------------------- */

const TvWall = ({ rooms, feed }: { rooms: any[]; feed: Record<string, any[]> }) => {
  if (!rooms.length) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Nothing live in this lane. Swipe →
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 auto-rows-[110px] gap-3">
      {rooms.map((r, i) => (
        <TvTile
          key={r.id}
          room={r}
          size={SIZE_PATTERN[i % SIZE_PATTERN.length]}
          chats={feed[r.id]?.filter((e) => e.kind === "chat").slice(-2) ?? []}
        />
      ))}
    </div>
  );
};

const TvTile = ({ room, size, chats }: any) => {
  const isBig = size.includes("col-span-2");
  return (
    <Link
      to={room.kind === "auction" ? `/live/${room.id}` : "/labs"}
      className={`relative ${size} rounded-2xl overflow-hidden neo-card group`}
    >
      <img
        src={room.cover}
        alt={room.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Pulse ring */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <span className="text-[9px] font-bold text-white tracking-wider uppercase">Live</span>
      </div>

      {/* Viewer ticker */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm">
        <Users className="w-2.5 h-2.5 text-white" />
        <span className="text-[9px] font-bold text-white tabular-nums">
          {room.viewers > 999 ? `${(room.viewers / 1000).toFixed(1)}k` : room.viewers}
        </span>
      </div>

      {/* Floating chat bubbles peeking out */}
      {isBig && chats.length > 0 && (
        <div className="absolute bottom-12 left-2 right-2 space-y-1 pointer-events-none">
          {chats.map((c: any) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block max-w-[85%] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] text-white truncate"
            >
              <span className="font-semibold text-primary">{c.user}</span> {c.text}
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-2">
        <p className="text-[8px] uppercase tracking-wider font-bold text-primary">
          {KIND_LABEL[room.kind]}
        </p>
        <h3 className={`font-bold text-white line-clamp-1 ${isBig ? "text-sm" : "text-[11px]"}`}>
          {room.title}
        </h3>
        {room.kind === "auction" && room.item && (
          <p className="text-[10px] font-bold text-primary mt-0.5">${room.item.topBid}</p>
        )}
      </div>
    </Link>
  );
};

/* ------------------------- LIVE MAP ------------------------- */

const ZONES = [
  { id: "auction", label: "Auctions", x: 20, y: 25, color: "hsl(45, 100%, 50%)" },
  { id: "together", label: "Hangouts", x: 75, y: 35, color: "hsl(200, 80%, 60%)" },
  { id: "sync", label: "Sync", x: 50, y: 75, color: "hsl(340, 80%, 60%)" },
];

const LiveMap = ({ rooms }: { rooms: any[] }) => {
  const [selected, setSelected] = useState<any>(null);

  // Place each room as a blip near its zone
  const blips = useMemo(() => {
    return rooms.map((r, i) => {
      const z = ZONES.find((z) => z.id === r.kind) ?? ZONES[0];
      const angle = (i * 137.5) % 360;
      const radius = 8 + (i % 3) * 4;
      return {
        room: r,
        color: z.color,
        x: z.x + Math.cos((angle * Math.PI) / 180) * radius,
        y: z.y + Math.sin((angle * Math.PI) / 180) * radius,
      };
    });
  }, [rooms]);

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-square rounded-3xl neo-card-inset overflow-hidden bg-gradient-to-br from-background to-black/40">
        {/* Radar grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
          {[20, 35, 50].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
          ))}
          <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
        </svg>

        {/* Sweep */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left"
          style={{
            background: "linear-gradient(to right, hsl(45, 100%, 50%, 0.6), transparent)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Zone labels */}
        {ZONES.map((z) => (
          <div
            key={z.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold tracking-wider uppercase opacity-50"
            style={{ left: `${z.x}%`, top: `${z.y - 10}%`, color: z.color }}
          >
            {z.label}
          </div>
        ))}

        {/* Blips */}
        {blips.map(({ room, x, y, color }) => (
          <button
            key={room.id}
            onClick={() => setSelected(room)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="relative flex h-3 w-3">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: color }}
              />
              <span
                className="relative inline-flex rounded-full h-3 w-3 ring-2 ring-background"
                style={{ backgroundColor: color }}
              />
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card rounded-2xl p-3 flex gap-3 items-center"
        >
          <img src={selected.cover} alt="" className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold text-primary">{KIND_LABEL[selected.kind]}</p>
            <h3 className="font-semibold text-sm line-clamp-1">{selected.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              {selected.viewers.toLocaleString()}
            </p>
          </div>
          <Link
            to={selected.kind === "auction" ? `/live/${selected.id}` : "/labs"}
            className="action-button action-button-primary py-1.5 text-xs"
          >
            Tune in
          </Link>
        </motion.div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Tap a blip to tune in · Swipe ← for grid
      </p>
    </div>
  );
};

// Hook placeholder (we just use useLive().feed) — remove stray import
const useLiveFeedNoop = () => null;

export default LiveIndex;
