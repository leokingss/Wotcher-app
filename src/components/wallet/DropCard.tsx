import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Play, Sparkles, Check, Clock } from "lucide-react";
import { Drop } from "@/data/mockWallet";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

interface Props { drop: Drop }

const formatLeft = (ms: number) => {
  if (ms <= 0) return "Public now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const DropCard = ({ drop }: Props) => {
  const { claimDrop, claimedDropIds, balance } = useWallet();
  const claimed = claimedDropIds.includes(drop.id);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (drop.access !== "followers-first" || !drop.publicAt) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [drop.access, drop.publicAt]);

  const onClaim = () => {
    if (claimed) return;
    if (drop.access === "paid" && (drop.price ?? 0) > balance) {
      toast.error("Top up your wallet to buy this drop");
      return;
    }
    const r = claimDrop(drop.id);
    if (r.ok) toast.success(drop.access === "paid" ? `Unlocked · -£${drop.price}` : "Added to your library");
    else toast.error(r.reason ?? "Could not claim");
  };

  const badge = drop.access === "free"
    ? { text: "FREE", cls: "bg-primary/15 text-primary" }
    : drop.access === "paid"
    ? { text: `£${drop.price?.toFixed(2)}`, cls: "bg-foreground text-background" }
    : { text: "EARLY", cls: "bg-secondary text-secondary-foreground" };

  const cta = claimed
    ? { label: "Claimed", icon: Check, disabled: true }
    : drop.access === "free"
    ? { label: "Get it", icon: Play, disabled: false }
    : drop.access === "paid"
    ? { label: `Buy £${drop.price}`, icon: Sparkles, disabled: false }
    : { label: "Early access", icon: Lock, disabled: false };

  const Icon = cta.icon;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="neo-card rounded-3xl overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[5/4]">
        <img src={drop.cover} alt={drop.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide ${badge.cls}`}>
          {badge.text}
        </span>
        {drop.access === "followers-first" && drop.publicAt && (
          <span className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatLeft(drop.publicAt - now)}
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-[11px] opacity-80">@{drop.creator}</p>
          <p className="text-sm font-bold leading-tight line-clamp-2">{drop.title}</p>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{drop.description}</p>
        <button
          onClick={onClaim}
          disabled={cta.disabled}
          className={`action-button ${claimed ? "neo-button-icon" : "action-button-primary"} py-2 text-xs flex items-center justify-center gap-1.5`}
        >
          <Icon className="w-3.5 h-3.5" /> {cta.label}
        </button>
      </div>
    </motion.div>
  );
};

export default DropCard;
