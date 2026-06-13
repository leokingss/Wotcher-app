import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Radio, X, Gavel, Headphones, Users, ChevronLeft, Lock, Unlock } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { LiveKind } from "@/data/mockLive";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

type TypeOption = {
  kind: LiveKind;
  label: string;
  desc: string;
  Icon: typeof Gavel;
  accent: string;
};

const TYPES: TypeOption[] = [
  { kind: "auction", label: "Auction", desc: "Sell an item live with timed bids", Icon: Gavel, accent: "text-destructive" },
  { kind: "sync", label: "Listening Party", desc: "Spin tracks together in sync", Icon: Headphones, accent: "text-primary" },
  { kind: "together", label: "Hang Out", desc: "Casual live room with your circle", Icon: Users, accent: "text-foreground" },
];

const GoLiveDialog = ({ open, onOpenChange }: Props) => {
  const { addRoom } = useLive();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<LiveKind | null>(null);
  const [title, setTitle] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [startingBid, setStartingBid] = useState("10");
  const [minutes, setMinutes] = useState("15");
  const [autoJoin, setAutoJoin] = useState(false);

  const reset = () => {
    setKind(null);
    setTitle("");
    setItemTitle("");
    setStartingBid("10");
    setMinutes("15");
    setAutoJoin(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const start = () => {
    if (!kind) return;
    if (!title.trim()) {
      toast.error("Add a stream title");
      return;
    }
    if (kind === "auction" && !itemTitle.trim()) {
      toast.error("Add the item up for auction");
      return;
    }
    const id = `live-${Math.random().toString(36).slice(2, 8)}`;
    const startBid = parseFloat(startingBid) || 0;
    const mins = parseInt(minutes) || 15;
    addRoom({
      id,
      kind,
      title: title.trim(),
      host: {
        id: user?.id ?? "you",
        name: user?.user_metadata?.username ?? "you",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id ?? "you"}`,
        verified: true,
      },
      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop",
      viewers: 1,
      bidders: 0,
      endsAt: new Date(Date.now() + mins * 60_000).toISOString(),
      item: kind === "auction"
        ? { id: `item-${id}`, title: itemTitle.trim(), image: "https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=600&h=600&fit=crop", startingBid: startBid, topBid: startBid }
        : undefined,
      bidders_avatars: [],
      autoJoin: kind === "together" ? autoJoin : undefined,
    });
    handleClose(false);
    toast.success("You're live!");
    navigate(`/live/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            {kind ? (
              <button onClick={() => setKind(null)} className="neo-button-icon p-2" aria-label="Back">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => handleClose(false)} className="neo-button-icon p-2" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            )}
            <DialogTitle className="flex items-center gap-2 font-semibold">
              <Radio className="w-4 h-4 text-destructive" />
              {kind ? TYPES.find((t) => t.kind === kind)?.label : "Go Live"}
            </DialogTitle>
            {kind ? (
              <button onClick={start} className="action-button action-button-primary py-1.5">Start</button>
            ) : (
              <span className="w-9" />
            )}
          </div>
        </DialogHeader>

        {!kind ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground px-1">Pick how you want to go live</p>
            {TYPES.map(({ kind: k, label, desc, Icon, accent }) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className="w-full neo-card-inset rounded-2xl p-4 flex items-center gap-3 text-left hover:translate-y-[-1px] transition-transform"
              >
                <div className="neo-button-icon p-3 shrink-0">
                  <Icon className={`w-5 h-5 ${accent}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stream title"
              className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm"
            />
            {kind === "auction" && (
              <>
                <input
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Item up for auction"
                  className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Starting bid</p>
                    <input
                      type="number"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Duration (min)</p>
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Live auctions extend by 10s if a bid arrives in the final 10 seconds (anti-snipe).
                </p>
              </>
            )}
            {kind !== "auction" && (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Duration (min)</p>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm"
                  />
                </div>
                {kind === "together" && (
                  <div className="neo-card-inset rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {autoJoin ? (
                        <Unlock className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{autoJoin ? "Open room" : "Approve guests"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {autoJoin
                            ? "Anyone can jump in automatically"
                            : "You accept or decline every request"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={autoJoin}
                      onCheckedChange={setAutoJoin}
                      aria-label="Allow auto-join"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GoLiveDialog;
