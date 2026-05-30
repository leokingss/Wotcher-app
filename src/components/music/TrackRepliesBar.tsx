import { useState } from "react";
import { Music2, Play, Pause } from "lucide-react";
import { trackById } from "@/data/mockCharts";
import { useMusicMeta } from "@/hooks/useMusicMeta";
import { usePlayer } from "@/hooks/usePlayer";
import TrackPickerSheet from "./TrackPickerSheet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  postId: string;
}

/**
 * Renders track replies under a post as small album-art chips, and exposes
 * a "reply with a track" button. Tapping a chip previews via the global
 * player. Phase 2.
 */
const TrackRepliesBar = ({ postId }: Props) => {
  const { user, profile } = useAuth();
  const { getReplies, addReply } = useMusicMeta();
  const { track: nowPlaying, toggle } = usePlayer();
  const [pickerOpen, setPickerOpen] = useState(false);

  const replies = getReplies(postId);

  const onPick = (t: { id: string; title: string; artist: string; artwork: string }) => {
    const uname = profile?.username ?? "you";
    addReply(postId, {
      trackId: t.id,
      userId: user?.id ?? "guest",
      username: uname,
      avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${uname}`,
      at: Date.now(),
    });
    toast.success("Track reply sent");
  };

  if (replies.length === 0) {
    return (
      <>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Music2 className="w-3.5 h-3.5" />
          Reply with a track
        </button>
        <TrackPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={onPick}
          title="Reply with a track"
          description="Send a track as your reaction."
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <p className="text-[11px] text-muted-foreground shrink-0">
          {replies.length} track {replies.length === 1 ? "reply" : "replies"}
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {replies.slice(0, 8).map((r, i) => {
            const t = trackById(r.trackId);
            if (!t) return null;
            const playing = nowPlaying?.id === t.id;
            return (
              <button
                key={`${r.trackId}-${i}`}
                onClick={() => toggle({ id: t.id, title: t.title, artist: t.artist, cover: t.artwork })}
                className="relative shrink-0 neo-button-icon p-0.5"
                aria-label={`Play ${t.title}`}
                title={`${t.title} — ${t.artist} (via @${r.username})`}
              >
                <img src={t.artwork} alt={t.title} className="w-8 h-8 rounded-md object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 hover:opacity-100 transition-opacity">
                  {playing ? <Pause className="w-3.5 h-3.5 text-primary" /> : <Play className="w-3.5 h-3.5 text-primary" />}
                </span>
                {playing && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setPickerOpen(true)}
            className="neo-button-icon w-8 h-8 flex items-center justify-center shrink-0"
            aria-label="Reply with a track"
          >
            <Music2 className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </div>
      <TrackPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onPick}
        title="Reply with a track"
      />
    </>
  );
};

export default TrackRepliesBar;
