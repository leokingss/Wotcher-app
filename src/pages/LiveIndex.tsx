import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Radio, Gavel, Music2, Coffee, Map as MapIcon, Layers, Clock } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useLive } from "@/hooks/useLiveStore";

type TabId = "all" | "auction" | "hangout" | "sync" | "map";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "auction", label: "Auctions", icon: Gavel },
  { id: "hangout", label: "Hangouts", icon: Coffee },
  { id: "sync", label: "Sync", icon: Music2 },
  { id: "map", label: "Map", icon: MapIcon },
];

const KIND_LABEL: Record<string, string> = {
  auction: "Auction",
  sync: "Sync",
  together: "Hangout",
};

const LiveIndex = () => {
  const { rooms, scheduledAuctions } = useLive();
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

        <div className="max-w-lg mx-auto px-3 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  active ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"
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
          className="max-w-lg mx-auto pt-2 touch-pan-y"
        >
          {tab === "map" ? (
            <div className="px-3"><LiveMap rooms={rooms} /></div>
          ) : (
            <>
              <LiveCarousel rooms={filtered} />
              <UpcomingAuctions items={scheduledAuctions} />
            </>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

/* ------------------------- LIVE CAROUSEL ------------------------- */

const LiveCarousel = ({ rooms }: { rooms: any[] }) => {
  if (!rooms.length) {
    return (
      <div className="px-3 mb-6">
        <div className="text-center py-16 text-muted-foreground text-sm neo-card-inset rounded-2xl">
          Nothing live in this lane. Swipe →
        </div>
      </div>
    );
  }
  return (
    <section className="mb-6">
      <div className="px-4 mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live now</h2>
        <span className="text-[10px] text-muted-foreground">{rooms.length} streaming · swipe →</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pb-2">
        {rooms.map((r) => (
          <LiveCard key={r.id} room={r} />
        ))}
        <div className="shrink-0 w-2" aria-hidden />
      </div>
    </section>
  );
};

const LiveCard = ({ room }: { room: any }) => (
  <Link
    to={room.kind === "auction" ? `/live/${room.id}` : "/labs"}
    className="shrink-0 snap-start w-[78%] max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden neo-card relative group"
  >
    <img
      src={room.cover}
      alt={room.title}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/90">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span className="text-[10px] font-extrabold text-white tracking-wider">LIVE</span>
    </div>

    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm">
      <Users className="w-3 h-3 text-white" />
      <span className="text-[10px] font-bold text-white tabular-nums">
        {room.viewers > 999 ? `${(room.viewers / 1000).toFixed(1)}k` : room.viewers}
      </span>
    </div>

    <div className="absolute bottom-20 left-3 flex items-center gap-2">
      <img src={room.host.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/60" />
      <span className="text-xs font-semibold text-white drop-shadow">{room.host.name}</span>
    </div>

    <div className="absolute bottom-0 inset-x-0 p-3">
      <p className="text-[10px] uppercase tracking-wider font-bold text-primary">{KIND_LABEL[room.kind]}</p>
      <h3 className="font-bold text-white text-base line-clamp-2 leading-tight">{room.title}</h3>
      {room.kind === "auction" && room.item && (
        <p className="text-sm font-extrabold text-primary mt-1">${room.item.topBid}</p>
      )}
    </div>
  </Link>
);

/* ------------------------- UPCOMING AUCTIONS ------------------------- */

const UpcomingAuctions = ({ items }: { items: any[] }) => {
  const upcoming = useMemo(
    () =>
      [...items]
        .filter((i) => new Date(i.startsAt).getTime() > Date.now())
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
    [items]
  );
  if (!upcoming.length) return null;

  return (
    <section className="px-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Gavel className="w-3.5 h-3.5" /> Upcoming auctions
        </h2>
        <span className="text-[10px] text-muted-foreground">{upcoming.length} scheduled</span>
      </div>
      <div className="space-y-2.5">
        {upcoming.map((s) => (
          <UpcomingRow key={s.id} item={s} />
        ))}
      </div>
    </section>
  );
};

const StartsIn = ({ startsAt }: { startsAt: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(startsAt).getTime() - now;
  if (diff <= 0) return <span className="text-destructive font-bold">starting…</span>;
  const m = Math.floor(diff / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return <span>in {h}h {m % 60}m</span>;
  }
  const urgent = diff < 60_000;
  return (
    <span className={urgent ? "text-destructive font-bold tabular-nums" : "tabular-nums"}>
      in {m}:{s.toString().padStart(2, "0")}
    </span>
  );
};

const UpcomingRow = ({ item }: { item: any }) => (
  <div className="neo-card rounded-2xl p-2.5 flex gap-3 items-center">
    <img src={item.itemImage} alt={item.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <img src={item.host.avatar} alt="" className="w-4 h-4 rounded-full" />
        <span className="text-[11px] font-semibold text-muted-foreground truncate">{item.host.name}</span>
      </div>
      <h3 className="text-sm font-bold line-clamp-1">{item.title}</h3>
      <div className="flex items-center gap-2 text-[11px] mt-0.5">
        <span className="flex items-center gap-1 text-primary font-semibold">
          <Clock className="w-3 h-3" /> <StartsIn startsAt={item.startsAt} />
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">start ${item.startingBid}</span>
      </div>
    </div>
    <button className="action-button action-button-primary py-1.5 text-xs">Remind</button>
  </div>
);

/* ------------------------- LIVE MAP ------------------------- */

const ZONES = [
  { id: "auction", label: "Auctions", x: 20, y: 25, color: "hsl(45, 100%, 50%)" },
  { id: "together", label: "Hangouts", x: 75, y: 35, color: "hsl(200, 80%, 60%)" },
  { id: "sync", label: "Sync", x: 50, y: 75, color: "hsl(340, 80%, 60%)" },
];

const LiveMap = ({ rooms }: { rooms: any[] }) => {
  const [selected, setSelected] = useState<any>(null);

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
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
          {[20, 35, 50].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
          ))}
          <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(45, 100%, 50%)" strokeWidth="0.15" />
        </svg>

        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left"
          style={{ background: "linear-gradient(to right, hsl(45, 100%, 50%, 0.6), transparent)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {ZONES.map((z) => (
          <div
            key={z.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold tracking-wider uppercase opacity-50"
            style={{ left: `${z.x}%`, top: `${z.y - 10}%`, color: z.color }}
          >
            {z.label}
          </div>
        ))}

        {blips.map(({ room, x, y, color }) => (
          <button
            key={room.id}
            onClick={() => setSelected(room)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }} />
              <span className="relative inline-flex rounded-full h-3 w-3 ring-2 ring-background" style={{ backgroundColor: color }} />
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

export default LiveIndex;
