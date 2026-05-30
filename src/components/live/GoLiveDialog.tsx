import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Radio, X } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

const GoLiveDialog = ({ open, onOpenChange }: Props) => {
  const { addRoom } = useLive();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [startingBid, setStartingBid] = useState("10");
  const [minutes, setMinutes] = useState("15");

  const start = () => {
    if (!title.trim() || !itemTitle.trim()) {
      toast.error("Add a stream title and item");
      return;
    }
    const id = `live-${Math.random().toString(36).slice(2, 8)}`;
    const start = parseFloat(startingBid) || 0;
    const mins = parseInt(minutes) || 15;
    addRoom({
      id,
      kind: "auction",
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
      item: { id: `item-${id}`, title: itemTitle.trim(), image: "https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=600&h=600&fit=crop", startingBid: start, topBid: start },
      bidders_avatars: [],
    });
    onOpenChange(false);
    toast.success("You're live!");
    navigate(`/live/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <button onClick={() => onOpenChange(false)} className="neo-button-icon p-2">
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="flex items-center gap-2 font-semibold">
              <Radio className="w-4 h-4 text-destructive" /> Go Live
            </DialogTitle>
            <button onClick={start} className="action-button action-button-primary py-1.5">Start</button>
          </div>
        </DialogHeader>
        <div className="p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stream title"
            className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm" />
          <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Item up for auction"
            className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Starting bid</p>
              <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)}
                className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Duration (min)</p>
              <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Live auctions extend by 10s if a bid arrives in the final 10 seconds (anti-snipe).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoLiveDialog;
