import { useEffect, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "auction-reminders-v1";

// Minutes before ends_at
const PRESETS: { label: string; minutes: number }[] = [
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
  { label: "6 hr", minutes: 360 },
  { label: "12 hr", minutes: 720 },
  { label: "1 day", minutes: 1440 },
];

type Store = Record<string, number>; // listingId -> reminder timestamp (ms)

const readStore = (): Store => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
};
const writeStore = (s: Store) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

interface Props {
  listingId: string;
  title: string;
  endsAt: string | null;
  className?: string;
}

const AuctionReminderButton = ({ listingId, title, endsAt, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [remindAt, setRemindAt] = useState<number | null>(null);

  // Load existing reminder
  useEffect(() => {
    const store = readStore();
    setRemindAt(store[listingId] ?? null);
  }, [listingId]);

  // Schedule in-session toast at the reminder time
  useEffect(() => {
    if (!remindAt) return;
    const ms = remindAt - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => {
      toast({
        title: "Auction ending soon",
        description: `"${title}" is wrapping up — last chance to bid.`,
      });
    }, Math.min(ms, 2147483000)); // setTimeout cap
    return () => clearTimeout(t);
  }, [remindAt, title]);

  const setReminder = (minutes: number) => {
    if (!endsAt) return;
    const ends = new Date(endsAt).getTime();
    const when = ends - minutes * 60_000;
    if (when <= Date.now()) {
      toast({ title: "Too late", description: `Auction ends in less than ${minutes} minutes.` });
      setOpen(false);
      return;
    }
    const store = readStore();
    store[listingId] = when;
    writeStore(store);
    setRemindAt(when);
    setOpen(false);
    toast({
      title: "Reminder set",
      description: `We'll ping you ${minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`} before it ends.`,
    });
  };

  const clearReminder = () => {
    const store = readStore();
    delete store[listingId];
    writeStore(store);
    setRemindAt(null);
    setOpen(false);
    toast({ title: "Reminder removed" });
  };

  const active = remindAt != null && remindAt > Date.now();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`neo-button-icon flex items-center justify-center ${
            active ? "!text-primary" : "text-white"
          } ${className ?? ""}`}
          aria-label="Set bid reminder"
        >
          {active ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-56 p-2 neo-card rounded-2xl border-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Remind me before it ends
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const ends = endsAt ? new Date(endsAt).getTime() : 0;
            const tooLate = ends - p.minutes * 60_000 <= Date.now();
            return (
              <button
                key={p.minutes}
                disabled={tooLate}
                onClick={() => setReminder(p.minutes)}
                className="text-xs font-medium py-2 rounded-xl neo-button-icon disabled:opacity-30 disabled:cursor-not-allowed hover:!text-primary transition-colors"
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {active && (
          <button
            onClick={clearReminder}
            className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" /> Clear reminder
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AuctionReminderButton;
