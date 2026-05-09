import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useInbox, startDMByUsername } from "@/hooks/useInbox";
import { formatRelative } from "@/lib/time";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const previewFor = (lm: any) => {
  if (!lm) return "No messages yet";
  if (lm.media_type === "voice") return "🎙️ Voice note";
  if (lm.media_type === "image") return "📷 Photo";
  if (lm.media_type === "video") return "🎬 Video";
  return lm.body ?? "";
};

const Messages = () => {
  const { items, loading } = useInbox();
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [username, setUsername] = useState("");

  const startNew = async () => {
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    try {
      const cid = await startDMByUsername(u);
      if (!cid) { toast.error("User not found"); return; }
      setNewOpen(false); setUsername("");
      navigate(`/messages/${cid}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start chat");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-semibold text-lg">Messages</h1>
          <button onClick={() => setNewOpen((v) => !v)} className="neo-button-icon p-2 text-primary"><Plus className="w-5 h-5" /></button>
        </div>
        {newOpen && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="neo-card-inset flex items-center gap-2 p-2 rounded-xl">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startNew()}
                placeholder="Start chat with @username"
                className="flex-1 bg-transparent text-sm outline-none px-2"
                autoFocus
              />
              <button onClick={startNew} className="text-sm font-semibold text-primary px-3">Start</button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 pt-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-12">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages yet" description="Start a conversation by tapping +" />
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <Link
                key={it.conversation_id}
                to={`/messages/${it.conversation_id}`}
                className={`neo-card flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] ${it.unread ? "ring-1 ring-primary/40" : ""}`}
              >
                <div className="neo-button-icon p-0.5 shrink-0">
                  <img
                    src={it.other?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${it.other?.username}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{it.other?.display_name || it.other?.username || "User"}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatRelative(it.last_message_at)}</span>
                  </div>
                  <p className={`text-xs truncate ${it.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{previewFor(it.last_message)}</p>
                </div>
                {it.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messages;
