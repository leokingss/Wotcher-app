import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, X } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import DropCard from "./DropCard";
import RedPacketCard from "./RedPacketCard";

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

  return (
    <section className="pt-2 pb-3">
      <button
        onClick={() => navigate("/wallet")}
        className="w-full flex items-center justify-between mb-2 px-1"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xs uppercase tracking-wider font-semibold">Drops & Packets</h2>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          Wallet <ChevronRight className="w-3 h-3" />
        </span>
      </button>

      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visiblePackets.map((p) => (
          <div key={p.id} className="w-[280px] shrink-0 snap-start relative group">
            <button
              onClick={() => dismiss(`p:${p.id}`)}
              aria-label="Dismiss"
              className="absolute top-2 right-2 z-10 neo-button-icon p-1.5 rounded-full bg-black/40 backdrop-blur"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div onClickCapture={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button[aria-label='Dismiss']")) return;
              // dismiss when user interacts with the packet itself
              setTimeout(() => dismiss(`p:${p.id}`), 800);
            }}>
              <RedPacketCard packet={p} />
            </div>
          </div>
        ))}
        {visibleDrops.map((d) => (
          <div key={d.id} className="w-[200px] shrink-0 snap-start relative">
            <button
              onClick={() => dismiss(`d:${d.id}`)}
              aria-label="Dismiss"
              className="absolute top-2 right-2 z-10 neo-button-icon p-1.5 rounded-full bg-black/40 backdrop-blur"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <DropCard drop={d} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivityPinnedDrops;
