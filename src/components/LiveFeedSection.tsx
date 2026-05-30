import { Link } from "react-router-dom";
import { Radio, Users, Gavel } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import LiveBadge from "./live/LiveBadge";
import EmptyState from "./EmptyState";

const KIND_LABEL: Record<string, string> = {
  auction: "Live auction",
  sync: "Sync session",
  together: "Live together",
};

const LiveFeedSection = () => {
  const { rooms } = useLive();

  if (!rooms.length) {
    return <EmptyState icon={Radio} title="Nothing live now" description="Check back soon." />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Radio className="w-4 h-4 text-destructive" /> Live now · {rooms.length}
        </h2>
        <Link to="/live" className="text-[11px] text-primary font-semibold">Open Live Lens →</Link>
      </div>
      {rooms.map((r) => (
        <Link
          key={r.id}
          to={r.kind === "auction" ? `/live/${r.id}` : "/labs"}
          className="neo-card rounded-2xl p-3 flex gap-3 items-center"
        >
          <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0">
            <img src={r.cover} alt={r.title} className="w-full h-full object-cover" />
            <LiveBadge className="absolute top-1.5 left-1.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              {KIND_LABEL[r.kind]}
            </p>
            <h3 className="font-semibold text-sm line-clamp-2">{r.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <img src={r.host.avatar} alt={r.host.name} className="w-5 h-5 rounded-full neo-button-icon" />
              <span className="text-xs text-muted-foreground truncate">{r.host.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.viewers.toLocaleString()}</span>
              {r.kind === "auction" && r.item && (
                <span className="text-primary font-bold flex items-center gap-1"><Gavel className="w-3 h-3" />${r.item.topBid}</span>
              )}
            </div>
          </div>
          <span className="action-button action-button-primary py-1.5 text-xs shrink-0">Join</span>
        </Link>
      ))}
    </div>
  );
};

export default LiveFeedSection;
