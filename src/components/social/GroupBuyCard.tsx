import { useEffect, useState } from "react";
import { Users, Share2, Check } from "lucide-react";
import { useGroupBuys } from "@/hooks/useGroupBuys";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

interface Props { groupBuyId: string }

const fmtCountdown = (ms: number) => {
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const GroupBuyCard = ({ groupBuyId }: Props) => {
  const { byId, join } = useGroupBuys();
  const { user } = useAuth();
  const { charge } = useWallet();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const g = byId(groupBuyId);
  if (!g) return null;

  const myName = user?.email?.split("@")[0] ?? "you";
  const joined = g.members.some((m) => m.username === myName);
  const pct = Math.min(100, (g.members.length / g.required) * 100);
  const remaining = g.endsAt - now;

  const onJoin = () => {
    if (joined || g.status !== "open") return;
    const ok = charge(g.groupPrice, "purchase", `Group buy · ${g.title}`, { groupBuyId: g.id });
    if (!ok) {
      toast.error("Insufficient balance");
      return;
    }
    const next = join(g.id, myName);
    if (next?.status === "succeeded") toast.success("Group complete! Everyone pays the group price.");
    else toast.success("You're in. Invite friends to unlock the price.");
  };

  const onShare = () => {
    const url = `${window.location.origin}/?gb=${g.id}`;
    if (navigator.share) navigator.share({ title: g.title, url }).catch(() => {});
    else {
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Invite link copied");
    }
  };

  return (
    <div className="neo-card rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <img src={g.cover} alt="" className="w-14 h-14 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-primary font-semibold">
            <Users className="w-3 h-3" /> Group buy
          </div>
          <p className="text-sm font-semibold truncate">{g.title}</p>
          <p className="text-xs text-muted-foreground">
            £{g.soloPrice} solo · <span className="text-primary font-semibold">£{g.groupPrice} if {g.required} join</span>
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-muted-foreground">{g.members.length}/{g.required} joined</span>
          <span className="text-muted-foreground">{fmtCountdown(remaining)} left</span>
        </div>
        <div className="h-2 neo-card-inset rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center mt-2 -space-x-2">
          {g.members.slice(0, 5).map((m, i) => (
            <img key={i} src={m.avatar} alt={m.username} className="w-6 h-6 rounded-full border-2 border-background" />
          ))}
          {Array.from({ length: Math.max(0, g.required - g.members.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-6 h-6 rounded-full border-2 border-background neo-card-inset" />
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {g.status === "succeeded" ? (
          <div className="action-button flex-1 flex items-center justify-center gap-1.5 text-primary">
            <Check className="w-4 h-4" /> Group price unlocked
          </div>
        ) : g.status === "expired" ? (
          <div className="action-button flex-1 text-muted-foreground">Group expired</div>
        ) : (
          <button
            onClick={onJoin}
            disabled={joined}
            className="action-button action-button-primary flex-1 disabled:opacity-60"
          >
            {joined ? "Joined · waiting" : `Join for £${g.groupPrice}`}
          </button>
        )}
        <button onClick={onShare} className="neo-button-icon p-2.5" aria-label="Invite">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GroupBuyCard;
