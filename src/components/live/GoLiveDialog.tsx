import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Radio, X, Gavel, Headphones, Users, ChevronLeft, Lock, Unlock, Camera, Clock } from "lucide-react";
import { useLive } from "@/hooks/useLiveStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { LiveKind } from "@/data/mockLive";

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
  { code: "BRL", symbol: "R$" },
  { code: "MXN", symbol: "Mex$" },
  { code: "INR", symbol: "₹" },
  { code: "KRW", symbol: "₩" },
  { code: "CNY", symbol: "¥" },
  { code: "CHF", symbol: "Fr" },
];
const CURRENCY_KEY = "golive:currency";

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
  const { addRoom, addScheduledAuction } = useLive();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<LiveKind | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [startingBid, setStartingBid] = useState("10");
  const [minutes, setMinutes] = useState("15");
  const [autoJoin, setAutoJoin] = useState(false);
  // Auction scheduling — 0 means "Go live now"
  const [startInMin, setStartInMin] = useState<0 | 5 | 15 | 30 | 60>(0);
  const [itemImage, setItemImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setKind(null);
    setTitle("");
    setDescription("");
    setItemTitle("");
    setStartingBid("10");
    setMinutes("15");
    setAutoJoin(false);
    setStartInMin(0);
    setItemImage(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setItemImage(URL.createObjectURL(f));
  };

  const start = () => {
    if (!kind) return;
    if (kind !== "together" && !title.trim()) {
      toast.error("Add a stream title");
      return;
    }
    if (kind === "auction" && !itemTitle.trim()) {
      toast.error("Add the item up for auction");
      return;
    }
    if (kind === "auction" && !itemImage) {
      toast.error("Add a photo of the item");
      return;
    }
    const host = {
      id: user?.id ?? "you",
      name: user?.user_metadata?.username ?? "you",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id ?? "you"}`,
      verified: true,
    };

    // Scheduled auction announcement
    if (kind === "auction" && startInMin > 0) {
      const sid = `sched-${Math.random().toString(36).slice(2, 8)}`;
      addScheduledAuction({
        id: sid,
        title: title.trim(),
        itemImage: itemImage!,
        host,
        startsAt: new Date(Date.now() + startInMin * 60_000).toISOString(),
        startingBid: parseFloat(startingBid) || 0,
        description: description.trim() || undefined,
      });
      handleClose(false);
      toast.success(`Auction scheduled in ${startInMin}m`);
      navigate("/live");
      return;
    }

    const id = `live-${Math.random().toString(36).slice(2, 8)}`;
    const startBid = parseFloat(startingBid) || 0;
    const mins = parseInt(minutes) || 15;
    addRoom({
      id,
      kind,
      title: kind === "together" ? "Hang Out" : title.trim(),
      host,
      cover: kind === "auction" && itemImage
        ? itemImage
        : "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop",
      viewers: 1,
      bidders: 0,
      endsAt: new Date(Date.now() + mins * 60_000).toISOString(),
      item: kind === "auction"
        ? { id: `item-${id}`, title: itemTitle.trim(), image: itemImage!, startingBid: startBid, topBid: startBid }
        : undefined,
      bidders_avatars: [],
      autoJoin: kind === "together" ? autoJoin : undefined,
      description: description.trim() || undefined,
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
            {kind !== "together" && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Stream title"
                className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm"
              />
            )}
            {kind !== "together" && (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional, but required to appear in search)"
                  rows={2}
                  maxLength={200}
                  className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  {description.trim()
                    ? `${description.length}/200 — searchable`
                    : "Without a description, your live won't show up in search."}
                </p>
              </div>
            )}
            {kind === "auction" && (
              <>
                {/* Item photo — required */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full neo-card-inset rounded-2xl aspect-[16/10] flex items-center justify-center overflow-hidden relative group"
                >
                  {itemImage ? (
                    <img src={itemImage} alt="Item" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-semibold">Add photo of item (required)</span>
                    </div>
                  )}
                  {itemImage && (
                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold">Tap to change</span>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickImage}
                />

                <input
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Item up for auction"
                  className="w-full neo-card-inset rounded-lg px-3 py-2.5 bg-transparent outline-none text-sm"
                />

                {/* Start timing */}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { v: 0, l: "Now" },
                      { v: 5, l: "in 5m" },
                      { v: 15, l: "in 15m" },
                      { v: 30, l: "in 30m" },
                      { v: 60, l: "in 1h" },
                    ] as const).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setStartInMin(o.v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          startInMin === o.v ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

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
                  {startInMin === 0
                    ? "Live auctions extend by 10s if a bid arrives in the final 10 seconds (anti-snipe)."
                    : `Your scheduled auction will appear in the Upcoming row on /live for the next ${startInMin}m.`}
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
