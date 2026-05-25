import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, Square, Trash2, Play, Pause, Paperclip, Image as ImageIcon, Film, Phone, Video as VideoIcon, Flag } from "lucide-react";
import { useConversation } from "@/hooks/useConversation";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/time";
import { toast } from "sonner";
import CallOverlay from "@/components/CallOverlay";
import ReportDialog from "@/components/ReportDialog";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const Conversation = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, other, loading, sendText, sendMedia } = useConversation(conversationId);

  const [text, setText] = useState("");
  const [call, setCall] = useState<null | "audio" | "video">(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const v = text;
    setText("");
    try { await sendText(v); } catch (e: any) { toast.error(e.message ?? "Send failed"); setText(v); }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const dur = elapsed;
        try {
          await sendMedia(new File([blob], "voice.webm", { type: "audio/webm" }), "voice", dur);
        } catch (e: any) { toast.error("Voice upload failed"); }
        setElapsed(0);
      };
      mr.start();
      recorderRef.current = mr;
      setElapsed(0); setRecording(true);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch { toast.error("Microphone access denied"); }
  };
  const stopRec = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };
  const cancelRec = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null as any;
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false); setElapsed(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const type = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : null;
    if (!type) { toast.error("Only images and videos supported"); return; }
    if (f.size > 25 * 1024 * 1024) { toast.error("File too large (25MB max)"); return; }
    try { await sendMedia(f, type as any); } catch { toast.error("Upload failed"); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/messages")} className="neo-button-icon p-2"><ArrowLeft className="w-5 h-5" /></button>
          {other && (
            <button onClick={() => navigate(`/profile/${other.username}`)} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="neo-button-icon p-0.5">
                <img src={other.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${other.username}`} alt="" className="w-9 h-9 rounded-full object-cover" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm truncate">{other.display_name || other.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{other.username}</p>
              </div>
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => other && setCall("audio")}
              disabled={!other}
              className="neo-button-icon p-2 rounded-full"
              aria-label="Voice call"
            >
              <Phone className="w-4 h-4 text-primary" />
            </button>
            <button
              onClick={() => other && setCall("video")}
              disabled={!other}
              className="neo-button-icon p-2 rounded-full"
              aria-label="Video call"
            >
              <VideoIcon className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </header>

      <CallOverlay open={!!call} mode={call ?? "audio"} other={other} onClose={() => setCall(null)} />

      <main ref={scrollerRef} className="flex-1 max-w-lg w-full mx-auto px-4 py-4 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-12">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12">Say hi 👋</div>
        ) : messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`relative group max-w-[78%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "neo-card rounded-bl-md"}`}>
                {(m as any).story_ref && (
                  <div className={`mb-2 flex items-center gap-2 rounded-xl p-1.5 border ${mine ? "border-primary-foreground/25 bg-black/20" : "border-border/50 bg-muted/40"}`}>
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-black/40 flex-shrink-0">
                      {(m as any).story_ref.media_url && (
                        /\.(mp4|webm|mov|m4v)(\?|$)/i.test((m as any).story_ref.media_url) ? (
                          <video src={(m as any).story_ref.media_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={(m as any).story_ref.media_url} alt="story" className="w-full h-full object-cover" />
                        )
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] uppercase tracking-wider font-semibold ${mine ? "opacity-70" : "text-muted-foreground"}`}>Replied to story</p>
                      {(m as any).story_ref.caption && (
                        <p className={`text-xs truncate max-w-[180px] ${mine ? "opacity-90" : "text-foreground"}`}>{(m as any).story_ref.caption}</p>
                      )}
                    </div>
                  </div>
                )}
                {m.media_type === "text" && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                {m.media_type === "voice" && m.media_url && (
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <audio controls src={m.media_url} className="h-8" />
                    {m.duration_seconds ? <span className="text-xs opacity-70">{fmt(m.duration_seconds)}</span> : null}
                  </div>
                )}
                {m.media_type === "image" && m.media_url && (
                  <img src={m.media_url} alt="" className="rounded-xl max-w-full max-h-72 object-cover" />
                )}
                {m.media_type === "video" && m.media_url && (
                  <video src={m.media_url} controls className="rounded-xl max-w-full max-h-72" />
                )}
                <p className={`text-[10px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>{formatRelative(m.created_at)}</p>
                {!mine && (
                  <div className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ReportDialog
                      targetType="message"
                      targetId={m.id}
                      trigger={
                        <button className="neo-button-icon w-5 h-5 flex items-center justify-center rounded-full" aria-label="Report message">
                          <Flag className="w-3 h-3 text-muted-foreground" />
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/30">
        <div className="max-w-lg mx-auto px-3 py-3">
          {recording ? (
            <div className="flex items-center gap-2 neo-card-inset p-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="flex-1 text-sm text-muted-foreground">Recording · {fmt(elapsed)}</span>
              <button onClick={cancelRec} className="neo-button-icon p-2"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={stopRec} className="neo-button-icon p-2"><Send className="w-4 h-4 text-primary" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 neo-card-inset p-2 rounded-xl">
              <button onClick={() => fileRef.current?.click()} className="neo-button-icon p-2" aria-label="Attach">
                <Paperclip className="w-4 h-4 text-primary" />
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={handleFile} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Message…"
                className="flex-1 bg-transparent text-sm outline-none px-1"
              />
              {text.trim() ? (
                <button onClick={handleSend} className="neo-button-icon p-2"><Send className="w-4 h-4 text-primary" /></button>
              ) : (
                <button onClick={startRec} className="neo-button-icon p-2" aria-label="Record"><Mic className="w-4 h-4 text-primary" /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversation;