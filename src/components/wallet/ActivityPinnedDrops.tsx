import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, X, Gift, PartyPopper } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "wotcher.activity.dismissedDropsPackets.v1";

const loadDismissed = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const ActivityPinnedDrops = () => {
  const { drops, packets, claimedDropIds } = useWallet();
  const { profile } = useAuth();
  const username = profile?.username ?? "you";
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>(() => loadDismissed());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    } catch {}
  }, [dismissed]);

  const now = Date.now();

  const visibleDrops = drops.filter((d) => {
    if (claimedDropIds.includes(d.id)) return false;
    if (dismissed.includes(`d:${d.id}`)) return false;
    if (d.access === "followers-first" && d.publicAt && d.publicAt <= now) return false;
    return true;
  });

  const visiblePackets = packets.filter((p) => {
    if (dismissed.includes(`p:${p.id}`)) return false;
    const remaining = p.shares.filter((s) => !s.claimedBy).length;
    if (remaining === 0) return false;
    if (p.shares.some((s) => s.claimedBy === username)) return false;
    return true;
  });

  if (!visibleDrops.length && !visiblePackets.length) return null;

  const dismiss = (key: string) => setDismissed((arr) => (arr.includes(key) ? arr : [...arr, key]));

  const open = (kind: "drop" | "packet", id: string) => {
    dismiss(`${kind === "drop" ? "d" : "p"}:${id}`);
    navigate("/wallet");
  };

  return (
    <section className="pt-2 pb-3">
      <button
        onClick={() => navigate("/wallet")}
        className="w-full flex items-center justify-between mb-2 px-1"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "hsl(45, 100%, 50%)" }} />
          <h2 className="text-xs uppercase tracking-wider font-semibold">Drops & Packets</h2>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          Wallet <ChevronRight className="w-3 h-3" />
        </span>
      </button>

      <div
        className="rounded-3xl p-2 space-y-2 border"
        style={{
          background: "hsl(45, 100%, 50%, 0.12)",
          borderColor: "hsl(45, 100%, 50%, 0.35)",
          boxShadow: "0 0 0 1px hsl(45, 100%, 50%, 0.15) inset",
        }}
      >
        {visiblePackets.map((p) => {
          const remaining = p.shares.filter((s) => !s.claimedBy).length;
          return (
            <div
              key={p.id}
              onClick={() => open("packet", p.id)}
              className="w-full text-left bg-background/70 backdrop-blur flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer"
            >
              <div className="neo-button-icon p-0.5 relative shrink-0">
                <img
                  src={p.creatorAvatar}
                  alt={p.creator}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-background border border-border p-1 rounded-full" style={{ color: "hsl(45, 100%, 50%)" }}>
                  <PartyPopper className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  <span className="font-semibold">@{p.creator}</span>{" "}
                  <span className="text-muted-foreground">sent you a red packet</span>
                  <span className="font-semibold" style={{ color: "hsl(45, 100%, 50%)" }}> · £{p.pool.toFixed(2)}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">{p.greeting} · {remaining} left</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(`p:${p.id}`); }}
                aria-label="Dismiss"
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        {visibleDrops.map((d) => (
          <div
            key={d.id}
            onClick={() => open("drop", d.id)}
            className="w-full text-left bg-background/70 backdrop-blur flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="neo-button-icon p-0.5 relative shrink-0">
              <img
                src={d.creatorAvatar}
                alt={d.creator}
                className="w-11 h-11 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-background border border-border p-1 rounded-full" style={{ color: "hsl(45, 100%, 50%)" }}>
                <Gift className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-semibold">@{d.creator}</span>{" "}
                <span className="text-muted-foreground">sent you a drop</span>
                <span className="text-foreground font-medium"> · {d.title}</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {d.access === "free" ? "Free" : d.access === "paid" ? `£${d.price?.toFixed(2)}` : "Early access"}
              </p>
            </div>
            {d.cover && (
              <img src={d.cover} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(`d:${d.id}`); }}
              aria-label="Dismiss"
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivityPinnedDrops;
