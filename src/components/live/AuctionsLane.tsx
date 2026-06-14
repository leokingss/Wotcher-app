import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gavel, Users, Plus, Clock, Megaphone, Bell, BellRing, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import LiveCountdown from "@/components/live/LiveCountdown";

const STORAGE_KEY = "upcoming-live-auctions-v1";
const REMINDERS_KEY = "upcoming-live-reminders-v1";

const PRESETS = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
];

interface Upcoming {
  id: string;
  title: string;
  host: string;
  cover: string;
  startsAt: string; // ISO
  minutes: number;
}

const COVERS = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop",
];

const readStore = (): Upcoming[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const writeStore = (s: Upcoming[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

const readReminders = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "{}"); }
  catch { return {}; }
};
const writeReminders = (r: Record<string, boolean>) =>
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));

interface Props {
  liveRooms: any[]; // live auction rooms (already filtered to kind === 'auction')
}

const AuctionsLane = ({ liveRooms }: Props) => {
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [composerOpen, setComposerOpen] = useState(false);

  // Load + prune expired
  useEffect(() => {
    const all = readStore();
    const fresh = all.filter((u) => new Date(u.startsAt).getTime() > Date.now() - 60_000);
    if (fresh.length !== all.length) writeStore(fresh);
    setUpcoming(fresh);
    setReminders(readReminders());
  }, []);

  // tick to re-prune
  useEffect(() => {
    const t = setInterval(() => {
      setUpcoming((prev) => {
        const fresh = prev.filter((u) => new Date(u.startsAt).getTime() > Date.now() - 60_000);
        if (fresh.length !== prev.length) writeStore(fresh);
        return fresh;
      });
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const sortedUpcoming = useMemo(
    () => [...upcoming].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
    [upcoming]
  );

  const addUpcoming = (title: string, minutes: number) => {
    const u: Upcoming = {
      id: Math.random().toString(36).slice(2, 10),
      title: title.trim() || "Live auction",
      host: "you",
      cover: COVERS[Math.floor(Math.random() * COVERS.length)],
      startsAt: new Date(Date.now() + minutes * 60_000).toISOString(),
      minutes,
    };
    const next = [u, ...upcoming];
    writeStore(next);
    setUpcoming(next);
    toast({
      title: "Announced",
      description: `Going live in ${minutes < 60 ? `${minutes} min` : "1 hour"}.`,
    });
    setComposerOpen(false);
  };

  const removeUpcoming = (id: string) => {
    const next = upcoming.filter((u) => u.id !== id);
    writeStore(next);
    setUpcoming(next);
  };

  const toggleReminder = (id: string) => {
    const next = { ...reminders, [id]: !reminders[id] };
    if (!next[id]) delete next[id];
    writeReminders(next);
    setReminders(next);
    toast({
      title: next[id] ? "Reminder set" : "Reminder off",
      description: next[id] ? "We'll ping you when it's about to start." : "",
    });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* --- LIVE NOW CAROUSEL --- */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <h2 className="text-sm font-semibold">Live now</h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {liveRooms.length} on air
          </span>
        </div>

        {liveRooms.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8 neo-card-inset rounded-2xl">
            No auctions live right now — be the first.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto -mx-3 px-3 pb-2 snap-x snap-mandatory scrollbar-hide">
            {liveRooms.map((r) => (
              <LiveAuctionCard key={r.id} room={r} />
            ))}
          </div>
        )}
      </section>

      {/* --- UPCOMING --- */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="neo-button-icon p-1.5">
            <Clock className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-sm font-semibold">Upcoming auctions</h2>
          <button
            onClick={() => setComposerOpen(true)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full neo-button-icon text-[11px] font-semibold !text-primary"
          >
            <Megaphone className="w-3 h-3" /> Announce
          </button>
        </div>

        {sortedUpcoming.length === 0 ? (
          <button
            onClick={() => setComposerOpen(true)}
            className="w-full neo-card-inset rounded-2xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Schedule your live auction</span>
            <span className="text-[10px]">Tell the crowd it starts in 5m, 15m, 30m or 1h</span>
          </button>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {sortedUpcoming.map((u) => (
                <UpcomingRow
                  key={u.id}
                  item={u}
                  reminded={!!reminders[u.id]}
                  isMine={u.host === "you"}
                  onToggleReminder={() => toggleReminder(u.id)}
                  onCancel={() => removeUpcoming(u.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* --- ANNOUNCE DIALOG --- */}
      <AnnounceDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onSubmit={addUpcoming}
      />
    </div>
  );
};

/* -------- Live auction carousel card -------- */

const LiveAuctionCard = ({ room }: { room: any }) => (
  <Link
    to={`/live/${room.id}`}
    className="relative w-64 shrink-0 snap-start neo-card p-1.5 rounded-3xl block ring-1 ring-destructive/40"
  >
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
      <img src={room.cover} alt={room.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive text-white">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          LIVE
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
          <Users className="w-2.5 h-2.5" />
          {room.viewers > 999 ? `${(room.viewers / 1000).toFixed(1)}k` : room.viewers}
        </span>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-3 text-white">
        <p className="text-[9px] uppercase tracking-wider font-bold text-primary">Auction</p>
        <h3 className="text-sm font-bold line-clamp-1">{room.title}</h3>
        {room.item && (
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[9px] uppercase opacity-70">Top bid</span>
            <span className="text-lg font-bold tabular-nums">${room.item.topBid}</span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-1 text-[10px]">
          <Clock className="w-3 h-3" />
          <LiveCountdown endsAt={room.endsAt} />
        </div>
      </div>
    </div>
  </Link>
);

/* -------- Upcoming row -------- */

const UpcomingRow = ({
  item,
  reminded,
  isMine,
  onToggleReminder,
  onCancel,
}: {
  item: Upcoming;
  reminded: boolean;
  isMine: boolean;
  onToggleReminder: () => void;
  onCancel: () => void;
}) => {
  const startsMs = new Date(item.startsAt).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = startsMs - now;
  const m = Math.max(0, Math.floor(diff / 60_000));
  const s = Math.max(0, Math.floor((diff % 60_000) / 1000));
  const urgent = diff < 5 * 60_000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="neo-card rounded-2xl p-2.5 flex items-center gap-3"
    >
      <img src={item.cover} alt="" className="w-14 h-14 rounded-xl object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Gavel className="w-3 h-3 text-primary" />
          <span className="text-[9px] uppercase font-bold text-primary tracking-wider">
            Starts soon
          </span>
          {isMine && (
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              · yours
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold line-clamp-1">{item.title}</h3>
        <p
          className={`text-xs tabular-nums font-medium ${
            urgent ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          in {m}:{s.toString().padStart(2, "0")}
        </p>
      </div>
      {isMine ? (
        <button
          onClick={onCancel}
          className="neo-button-icon p-2 text-muted-foreground hover:text-destructive"
          aria-label="Cancel announcement"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onToggleReminder}
          className={`neo-button-icon p-2 ${reminded ? "!text-primary" : "text-muted-foreground"}`}
          aria-label="Remind me"
        >
          {reminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>
      )}
    </motion.div>
  );
};

/* -------- Announce dialog -------- */

const AnnounceDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSubmit: (title: string, minutes: number) => void;
}) => {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(15);

  useEffect(() => {
    if (open) {
      setTitle("");
      setMinutes(15);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Megaphone className="w-4 h-4 text-primary" />
            Announce a live auction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              What are you selling?
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rare Blue Note pressing"
              className="mt-1.5 w-full neo-card-inset rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Going live in
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const active = minutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    onClick={() => setMinutes(p.minutes)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "neo-card-inset !text-primary"
                        : "neo-button-icon text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onSubmit(title, minutes)}
            className="w-full action-button action-button-primary py-3 font-semibold"
          >
            Announce
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuctionsLane;
