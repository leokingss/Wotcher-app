import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Share2, Send, Users, Gavel } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import LiveBadge from "@/components/live/LiveBadge";
import LiveCountdown from "@/components/live/LiveCountdown";
import FloatingHearts from "@/components/live/FloatingHearts";
import { toast } from "sonner";

const QUICK_BIDS = [5, 10, 25];

const LiveRoom = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getRoom, feed, placeBid, sendChat } = useLive();
  const room = getRoom(id);
  const events = feed[id] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatText, setChatText] = useState("");
  const [customBid, setCustomBid] = useState("");
  const [heartTrigger, setHeartTrigger] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const bidderAvatars = useMemo(() => {
    const set = new Map<string, string>();
    events.filter((e) => e.kind === "bid").slice(-6).forEach((e: any) => set.set(e.user, e.avatar));
    return Array.from(set.entries()).slice(-5);
  }, [events]);

  if (!room || !room.item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">This live stream isn't available.</p>
        <button onClick={() => navigate("/live")} className="action-button action-button-primary">
          Back to Live
        </button>
      </div>
    );
  }

  const onQuickBid = (delta: number) => {
    const next = room.item!.topBid + delta;
    placeBid(room.id, next);
    toast.success(`Bid placed at $${next}`);
  };

  const onCustomBid = () => {
    const v = parseFloat(customBid);
    if (!v || v <= room.item!.topBid) {
      toast.error(`Must be > $${room.item!.topBid}`);
      return;
    }
    placeBid(room.id, v);
    setCustomBid("");
  };

  const onShare = async () => {
    const url = `${window.location.origin}/live/${room.id}`;
    try {
      if (navigator.share) await navigator.share({ title: room.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Host video area */}
      <div className="relative h-[44vh] min-h-[280px] bg-black overflow-hidden">
        <img src={room.cover} alt={room.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2 bg-background/40 backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1">
              <Users className="w-3 h-3" /> {room.viewers.toLocaleString()}
            </span>
          </div>
          <button onClick={onShare} className="neo-button-icon p-2 bg-background/40 backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <img src={room.host.avatar} alt={room.host.name} className="w-10 h-10 rounded-full ring-2 ring-white/70" />
          <div className="text-white">
            <p className="text-sm font-bold leading-tight">{room.host.name}</p>
            <p className="text-[11px] opacity-80">{room.title}</p>
          </div>
        </div>

        <FloatingHearts trigger={heartTrigger} />
      </div>

      {/* Item + top bid */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="neo-card rounded-2xl p-3 flex gap-3 items-center">
          <img src={room.item.image} alt={room.item.title} className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Top bid</p>
            <p className="text-2xl font-extrabold text-primary leading-none">${room.item.topBid}</p>
            <p className="text-xs text-foreground/80 truncate">{room.item.title}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <LiveCountdown endsAt={room.endsAt} big />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">left</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 px-1">
          <div className="flex -space-x-2">
            {(bidderAvatars.length ? bidderAvatars : room.bidders_avatars.slice(0, 5).map((a, i) => [`u${i}`, a] as [string, string])).map(([k, a]) => (
              <img key={k} src={a} className="w-6 h-6 rounded-full ring-2 ring-background" alt="" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{room.viewers.toLocaleString()}</span> watching ·{" "}
            <span className="font-semibold text-foreground">{room.bidders}</span> bidding
          </p>
        </div>
      </div>

      {/* Combined feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-1.5">
        {events.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">Say hi to kick off the room…</p>
        )}
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-2 animate-fade-in">
            <img src={e.avatar} className="w-6 h-6 rounded-full mt-0.5" alt="" />
            <div className="flex-1 min-w-0">
              {e.kind === "bid" ? (
                <div className="neo-card-inset rounded-lg px-2 py-1 inline-flex items-center gap-1.5">
                  <Gavel className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold">{e.user}</span>
                  <span className="text-xs text-primary font-extrabold">${(e as any).amount}</span>
                </div>
              ) : e.kind === "join" ? (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-semibold">{e.user}</span> joined
                </p>
              ) : (
                <p className="text-xs">
                  <span className="font-semibold mr-1">{e.user}</span>
                  <span className="text-foreground/90">{(e as any).text}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/50 px-3 py-2 space-y-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-1.5">
          {QUICK_BIDS.map((d) => (
            <button
              key={d}
              onClick={() => onQuickBid(d)}
              className="flex-1 action-button action-button-primary py-2 text-xs"
            >
              +${d}
            </button>
          ))}
          <input
            type="number"
            placeholder="Custom"
            value={customBid}
            onChange={(e) => setCustomBid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCustomBid()}
            className="w-20 neo-card-inset rounded-lg px-2 py-2 bg-transparent outline-none text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && chatText.trim()) {
                sendChat(room.id, chatText.trim());
                setChatText("");
              }
            }}
            placeholder="Say something…"
            className="flex-1 neo-card-inset rounded-full px-4 py-2 bg-transparent outline-none text-sm"
          />
          <button
            onClick={() => {
              if (chatText.trim()) {
                sendChat(room.id, chatText.trim());
                setChatText("");
              }
            }}
            className="neo-button-icon p-2.5 rounded-full"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => setHeartTrigger((n) => n + 1)}
            className="neo-button-icon p-2.5 rounded-full"
          >
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveRoom;
