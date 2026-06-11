import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Share2, Send, Users, Gavel } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import LiveBadge from "@/components/live/LiveBadge";
import LiveCountdown from "@/components/live/LiveCountdown";
import FloatingHearts from "@/components/live/FloatingHearts";
import TipButton from "@/components/wallet/TipButton";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

const QUICK_BIDS = [5, 10, 25];

const LiveRoom = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getRoom, feed, placeBid, sendChat } = useLive();
  const { balance, charge } = useWallet();
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

  const topBidder = useMemo(() => {
    const bids = events.filter((e) => e.kind === "bid");
    const last = bids[bids.length - 1] as any;
    if (last) return { name: last.user, avatar: last.avatar };
    if (room?.item?.topBidderId) {
      return { name: room.item.topBidderId, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(room.item.topBidderId)}` };
    }
    return null;
  }, [events, room?.item?.topBidderId]);

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
    if (next > balance) { toast.error(`Bid exceeds wallet (£${balance.toFixed(2)})`); return; }
    if (!charge(next, "bid", `Live bid · ${room.item!.title}`, { roomId: room.id })) {
      toast.error("Could not place bid");
      return;
    }
    placeBid(room.id, next);
    toast.success(`Bid placed at £${next}`);
  };

  const onCustomBid = () => {
    const v = parseFloat(customBid);
    if (!v || v <= room.item!.topBid) {
      toast.error(`Must be > £${room.item!.topBid}`);
      return;
    }
    if (v > balance) { toast.error(`Bid exceeds wallet (£${balance.toFixed(2)})`); return; }
    if (!charge(v, "bid", `Live bid · ${room.item!.title}`, { roomId: room.id })) {
      toast.error("Could not place bid");
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
    <div className="fixed inset-0 bg-black flex justify-center z-50">
      <div className="relative w-full h-full flex flex-col">
      {/* Full-screen host video */}
      <div className="absolute inset-0">
        <img src={room.cover} alt={room.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
      </div>

      {/* Top controls */}
      <div className="relative z-10 p-3 flex items-center justify-between">
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

      {/* Host info */}
      <div className="relative z-10 px-3 flex items-center gap-2">
        <img src={room.host.avatar} alt={room.host.name} className="w-10 h-10 rounded-full ring-2 ring-white/70" />
        <div className="text-white">
          <p className="text-sm font-bold leading-tight">{room.host.name}</p>
          <p className="text-[11px] opacity-80">{room.title}</p>
        </div>
      </div>

      <FloatingHearts trigger={heartTrigger} />

      {/* Chat feed - middle, scrollable, transparent */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-1.5 mt-auto max-h-[35vh]">
        {events.slice(-20).map((e) => (
          <div key={e.id} className="flex items-start gap-2 animate-fade-in">
            <img src={e.avatar} className="w-6 h-6 rounded-full mt-0.5" alt="" />
            <div className="flex-1 min-w-0">
              {e.kind === "bid" ? (
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 inline-flex items-center gap-1.5">
                  <Gavel className="w-3 h-3 text-primary" />
                  <button onClick={() => navigate(`/profile/${e.user}`)} className="text-xs font-bold text-white hover:underline">
                    {e.user}
                  </button>
                  <span className="text-xs text-primary font-extrabold">${(e as any).amount}</span>
                </div>
              ) : e.kind === "join" ? (
                <p className="text-[11px] text-white/70">
                  <button onClick={() => navigate(`/profile/${e.user}`)} className="font-semibold hover:underline">
                    {e.user}
                  </button>{" "}
                  joined
                </p>
              ) : (
                <p className="text-xs text-white">
                  <button onClick={() => navigate(`/profile/${e.user}`)} className="font-semibold mr-1 hover:underline">
                    {e.user}
                  </button>
                  <span className="opacity-90">{(e as any).text}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Top bid card + bidding + chat input */}
      <div className="relative z-20 px-3 pb-3 pt-2 space-y-2 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Top bid / auction info — moved above bidding */}
        <div className="neo-card rounded-2xl p-3 flex gap-3 items-center">
          <img src={room.item.image} alt={room.item.title} className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Top bid</p>
            <p className="text-2xl font-extrabold text-primary leading-none">${room.item.topBid}</p>
            {topBidder ? (
              <button onClick={() => navigate(`/profile/${topBidder.name}`)} className="mt-1 flex items-center gap-1.5 hover:underline">
                <img src={topBidder.avatar} className="w-4 h-4 rounded-full" alt="" />
                <span className="text-[11px] font-semibold text-foreground truncate">{topBidder.name}</span>
              </button>
            ) : (
              <p className="text-[11px] text-muted-foreground">No bids yet</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <LiveCountdown endsAt={room.endsAt} big />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">left</span>
          </div>
        </div>

        {/* Quick + custom bids */}
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
            className="w-20 neo-card-inset rounded-lg px-2 py-2 bg-transparent outline-none text-xs text-white placeholder:text-white/50"
          />
        </div>

        {/* Chat input */}
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
            className="flex-1 neo-card-inset rounded-full px-4 py-2 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
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
          <TipButton recipient={room.host.name.replace(/\s+/g, "_").toLowerCase()} source="live" variant="icon" />
          <button
            onClick={() => setHeartTrigger((n) => n + 1)}
            className="neo-button-icon p-2.5 rounded-full"
          >
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LiveRoom;

