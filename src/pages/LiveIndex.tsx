import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Radio } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import LiveBadge from "@/components/live/LiveBadge";

const KIND_LABEL: Record<string, string> = {
  auction: "Live auction",
  sync: "Sync session",
  together: "Live together",
};

const LiveIndex = () => {
  const { rooms } = useLive();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-destructive" /> Live now
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-3">
        {rooms.map((r) => (
          <Link
            key={r.id}
            to={r.kind === "auction" ? `/live/${r.id}` : "/labs"}
            className="neo-card rounded-2xl p-3 flex gap-3 items-center"
          >
            <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0">
              <img src={r.cover} alt={r.title} className="w-full h-full object-cover" />
              <LiveBadge className="absolute top-2 left-2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                {KIND_LABEL[r.kind]}
              </p>
              <h3 className="font-semibold text-sm line-clamp-2">{r.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <img src={r.host.avatar} alt={r.host.name} className="w-6 h-6 rounded-full neo-button-icon" />
                <span className="text-xs text-muted-foreground truncate">{r.host.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.viewers.toLocaleString()}</span>
                {r.kind === "auction" && r.item && (
                  <span className="text-primary font-bold">${r.item.topBid}</span>
                )}
              </div>
            </div>
            <span className="action-button action-button-primary py-1.5 text-xs shrink-0">Join</span>
          </Link>
        ))}
      </main>
    </div>
  );
};

export default LiveIndex;
