import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Share2, Send, Users, Mic, MicOff, Video, VideoOff, X, UserPlus, Loader2, Heart } from "lucide-react";
import LiveBadge from "@/components/live/LiveBadge";
import FloatingHearts from "@/components/live/FloatingHearts";
import TipButton from "@/components/wallet/TipButton";
import { useLive } from "@/hooks/useLiveStore";
import type { LiveRoom } from "@/data/mockLive";
import { toast } from "sonner";

const SEAT_NAMES = [
  "vinylvibes", "soulseeker", "tapehead", "bassface",
  "groovekid", "lofilover", "wax_dynasty", "midnightDJ",
  "echo.kid", "nori", "ola", "kim", "sam", "lex", "rio",
];
const AV = (s: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
const COVERS = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1546961342-1c9ae6a715ba?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&h=600&fit=crop",
];

interface Seat {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  muted: boolean;
  camOff: boolean;
}

const HangOutRoom = ({ room }: { room: LiveRoom }) => {
  const navigate = useNavigate();
  const { feed, sendChat } = useLive();
  const events = feed[room.id] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatText, setChatText] = useState("");
  const [heartTrigger, setHeartTrigger] = useState(0);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [searching, setSearching] = useState(true);
  const [requests, setRequests] = useState<Seat[]>([]);
  const seatsRef = useRef(seats);
  seatsRef.current = seats;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events.length]);

  // Simulate ome.tv-style auto matchmaking — drop a join-request every few seconds
  useEffect(() => {
    const t = setInterval(() => {
      if (seatsRef.current.length >= 4) {
        setSearching(false);
        return;
      }
      const used = new Set([...seatsRef.current.map((s) => s.name), room.host.name]);
      const pool = SEAT_NAMES.filter((n) => !used.has(n));
      if (!pool.length) return;
      const name = pool[Math.floor(Math.random() * pool.length)];
      const seat: Seat = {
        id: `seat-${Math.random().toString(36).slice(2, 7)}`,
        name,
        avatar: AV(name),
        cover: COVERS[Math.floor(Math.random() * COVERS.length)],
        muted: Math.random() < 0.3,
        camOff: false,
      };
      // 70% auto-join, 30% requests-to-join
      if (Math.random() < 0.7) {
        setSeats((prev) => (prev.length >= 4 ? prev : [...prev, seat]));
        toast.success(`@${name} joined the hangout`);
      } else {
        setRequests((prev) => [...prev, seat]);
      }
    }, 3500);
    return () => clearInterval(t);
  }, [room.host.name]);

  const acceptRequest = (s: Seat) => {
    if (seats.length >= 4) { toast.error("Hangout is full"); return; }
    setSeats((prev) => [...prev, s]);
    setRequests((prev) => prev.filter((r) => r.id !== s.id));
  };
  const declineRequest = (s: Seat) => setRequests((prev) => prev.filter((r) => r.id !== s.id));
  const kickSeat = (s: Seat) => {
    setSeats((prev) => prev.filter((x) => x.id !== s.id));
    toast(`@${s.name} left the room`);
  };
  const toggleMute = (s: Seat) =>
    setSeats((prev) => prev.map((x) => (x.id === s.id ? { ...x, muted: !x.muted } : x)));
  const toggleCam = (s: Seat) =>
    setSeats((prev) => prev.map((x) => (x.id === s.id ? { ...x, camOff: !x.camOff } : x)));

  const onShare = async () => {
    const url = `${window.location.origin}/live/${room.id}`;
    try {
      if (navigator.share) await navigator.share({ title: room.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const slots: (Seat | null)[] = [seats[0] ?? null, seats[1] ?? null, seats[2] ?? null, seats[3] ?? null];

  return (
    <div className="fixed inset-0 bg-black flex justify-center z-50 h-[100dvh] w-screen overflow-hidden">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Top controls */}
        <div className="relative z-20 p-3 flex items-center justify-between">
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

        {/* Top half: host */}
        <div className="relative h-1/2 mx-3 rounded-2xl overflow-hidden ring-1 ring-white/10">
          <img src={room.cover} alt={room.host.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <FloatingHearts trigger={heartTrigger} />
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm flex items-center gap-1.5">
            <img src={room.host.avatar} className="w-5 h-5 rounded-full ring-1 ring-white/70" alt="" />
            <span className="text-[11px] font-bold text-white">{room.host.name}</span>
            <span className="text-[9px] uppercase tracking-wide text-primary font-extrabold">Host</span>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-xs text-white/95 line-clamp-1 font-semibold drop-shadow">{room.title}</p>
          </div>
        </div>

        {/* Bottom half: 2x2 guest grid */}
        <div className="relative flex-1 min-h-0 mt-2 mx-3 grid grid-cols-2 grid-rows-2 gap-2">
          {slots.map((s, i) => (
            <div key={s?.id ?? `empty-${i}`} className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/60">
              {s ? (
                <>
                  {s.camOff ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-700">
                      <img src={s.avatar} className="w-12 h-12 rounded-full ring-2 ring-white/30" alt="" />
                    </div>
                  ) : (
                    <img src={s.cover} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-1 left-1 right-1 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white truncate max-w-[70%]">
                      @{s.name}
                    </span>
                    <button
                      onClick={() => kickSeat(s)}
                      className="neo-button-icon p-1 bg-background/40 backdrop-blur-sm"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-1 right-1 flex items-center gap-1">
                    <button onClick={() => toggleMute(s)} className="neo-button-icon p-1 bg-background/40 backdrop-blur-sm" aria-label="Mute">
                      {s.muted ? <MicOff className="w-3 h-3 text-destructive" /> : <Mic className="w-3 h-3 text-white" />}
                    </button>
                    <button onClick={() => toggleCam(s)} className="neo-button-icon p-1 bg-background/40 backdrop-blur-sm" aria-label="Camera">
                      {s.camOff ? <VideoOff className="w-3 h-3 text-destructive" /> : <Video className="w-3 h-3 text-white" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                  {searching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-[10px] uppercase tracking-wide font-semibold">Searching…</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-semibold">Open seat</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Join requests overlay */}
          {requests.length > 0 && (
            <div className="absolute -top-2 left-0 right-0 -translate-y-full px-1">
              <div className="neo-card rounded-xl px-2 py-1.5 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground shrink-0">Requests</span>
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center gap-1 shrink-0">
                    <img src={r.avatar} className="w-5 h-5 rounded-full" alt="" />
                    <span className="text-[10px] font-semibold truncate max-w-[60px]">@{r.name}</span>
                    <button onClick={() => acceptRequest(r)} className="action-button action-button-primary px-2 py-0.5 text-[10px]">Accept</button>
                    <button onClick={() => declineRequest(r)} className="neo-button-icon p-1" aria-label="Decline">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat strip */}
        <div
          ref={scrollRef}
          className="relative z-10 mx-3 mt-2 max-h-20 overflow-y-auto space-y-1"
        >
          {events.slice(-6).map((e) => (
            <div key={e.id} className="flex items-start gap-1.5 animate-fade-in">
              <img src={e.avatar} className="w-4 h-4 rounded-full mt-0.5" alt="" />
              <p className="text-[11px] text-white/90 leading-tight">
                <span className="font-semibold mr-1">{e.user}</span>
                {e.kind === "chat" ? (e as any).text : e.kind === "join" ? "joined" : ""}
              </p>
            </div>
          ))}
        </div>

        {/* Chat input */}
        <div className="relative z-20 px-3 pb-3 pt-2 flex items-center gap-2">
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
              if (chatText.trim()) { sendChat(room.id, chatText.trim()); setChatText(""); }
            }}
            className="neo-button-icon p-2.5 rounded-full"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
          <TipButton recipient={room.host.name.replace(/\s+/g, "_").toLowerCase()} source="live" variant="icon" />
          <button onClick={() => setHeartTrigger((n) => n + 1)} className="neo-button-icon p-2.5 rounded-full">
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HangOutRoom;
