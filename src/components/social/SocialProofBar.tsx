import { Eye, Gavel, TrendingUp } from "lucide-react";
import { useSocialProof } from "@/hooks/useSocialProof";

interface Props { listingId: string; isAuction?: boolean }

const SocialProofBar = ({ listingId, isAuction }: Props) => {
  const s = useSocialProof(listingId);
  return (
    <div className="neo-card-inset rounded-2xl px-3 py-2 flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        <Eye className="w-3.5 h-3.5" />
        <span className="font-semibold text-foreground tabular-nums">{s.watching}</span> watching
      </span>
      {isAuction && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Gavel className="w-3.5 h-3.5" />
          <span className="font-semibold text-foreground tabular-nums">{s.bidding}</span> bidding
        </span>
      )}
      {!isAuction && s.soldToday > 0 && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground tabular-nums">{s.soldToday}</span> sold today
        </span>
      )}
      <div className="ml-auto flex -space-x-2">
        {s.recentBuyers.slice(0, 3).map((b, i) => (
          <img
            key={i}
            src={b.avatar}
            alt={b.username}
            title={`@${b.username}`}
            className="w-6 h-6 rounded-full border-2 border-background object-cover"
          />
        ))}
      </div>
    </div>
  );
};

export default SocialProofBar;
