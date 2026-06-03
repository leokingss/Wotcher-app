import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Bookmark, Play, Pause, Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTop10Save } from "@/hooks/useTop10Save";
import ReactionButton from "./ReactionButton";
import StrandWave from "./StrandWave";
import CommentComposer from "./CommentComposer";
import VoiceNotePlayer from "./VoiceNotePlayer";
import { useTargetComments } from "@/hooks/useTargetComments";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/hooks/usePlayer";
import { formatRelative } from "@/lib/time";

interface SongCardProps {
  id: string | number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  likes: number;
  comments: number;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  /** Show a "+" button that adds this song to the viewer's personal Top 10. */
  showAddToTop10?: boolean;
}

const SongCard = ({ id, title, artist, duration, cover, likes, comments, isCommentsOpen, onToggleComments, showAddToTop10 = false }: SongCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);
  const { playingId, toggle } = usePlayer();
  const isPlaying = playingId === id;
  const top10 = useTop10Save(id);

  const handleAddToTop10 = async () => {
    if (!top10.available) {
      toast.error("Sign in to save songs to your Top 10");
      return;
    }
    const wasSaved = top10.saved;
    const res = await top10.toggle();
    if (!res.ok) {
      if (res.reason === "full") toast.error("Your Top 10 is full — remove a song first");
      else toast.error("Couldn't update your Top 10");
      return;
    }
    if (wasSaved) toast("Removed from your Top 10");
    else toast.success(`Added to your Top 10 at #${res.rank}`);
  };

  const trackId = typeof id === "string" ? id : null;
  const {
    comments: commentList,
    count,
    addComment,
    addVoiceComment,
    editingId,
    editText,
    setEditText,
    canEdit,
    startEdit,
    cancelEdit,
    saveEdit,
  } = useTargetComments({ trackId: isCommentsOpen ? trackId : null });

  const totalComments = isCommentsOpen ? count : comments;

  const handleLike = () => {
    if (isDisliked) { setIsDisliked(false); setDislikeCount(p => p - 1); }
    setIsLiked(!isLiked);
    setLikeCount(p => isLiked ? p - 1 : p + 1);
  };

  const handleDislike = () => {
    if (isLiked) { setIsLiked(false); setLikeCount(p => p - 1); }
    setIsDisliked(!isDisliked);
    setDislikeCount(p => isDisliked ? p - 1 : p + 1);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
    setShowAll(true);
  };

  const handlePostVoice = async (blob: Blob, durationSec: number) => {
    await addVoiceComment(blob, durationSec);
    setShowAll(true);
  };

  const formatCount = (c: number | string) => {
    const n = typeof c === "number" ? c : Number(c);
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(c);
  };

  const display = showAll ? commentList : commentList.slice(0, 3);

  return (
    <div className="neo-card p-3 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={cover} alt={title} className="w-12 h-12 rounded-lg object-cover" />
          <button
            onClick={() => toggle({ id, title, artist, cover })}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate max-w-[45%]">{title}</p>
            {isPlaying && (
              <div className="flex-1 min-w-0">
                <StrandWave isPlaying={isPlaying} height={20} />
              </div>
            )}
            <span className="text-xs text-muted-foreground shrink-0">{duration}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <ReactionButton type="like" active={isLiked} count={formatCount(likeCount)} onClick={handleLike} />
          <ReactionButton type="dislike" active={isDisliked} count={dislikeCount} onClick={handleDislike} />
          <button onClick={onToggleComments} className={`neo-button-icon p-2.5 flex items-center gap-1.5 ${isCommentsOpen ? 'neo-card-inset' : ''}`}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{totalComments}</span>
          </button>
          <button className="neo-button-icon p-2.5">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showAddToTop10 && (
            <button
              onClick={handleAddToTop10}
              disabled={top10.loading}
              aria-label={top10.saved ? `In your Top 10 (#${top10.rank})` : "Add to my Top 10"}
              title={top10.saved ? `In your Top 10 (#${top10.rank})` : "Add to my Top 10"}
              className={`neo-button-icon p-2.5 flex items-center gap-1 ${top10.saved ? 'neo-card-inset' : ''}`}
            >
              {top10.saved ? (
                <>
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary tabular-nums">#{top10.rank}</span>
                </>
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
          )}
          <button onClick={() => setIsSaved(!isSaved)} className="neo-button-icon p-2.5">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {isCommentsOpen && trackId && (
        <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in space-y-3">
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {display.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <img
                  src={c.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.profile?.username ?? "u"}`}
                  alt={c.profile?.username ?? ""}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => c.profile?.username && navigate(`/profile/${c.profile.username}`)} className="text-xs font-semibold hover:underline">
                      {c.profile?.username ?? "user"}
                    </button>
                    <span className="text-xs text-muted-foreground">{formatRelative(c.created_at)}</span>
                    {canEdit(c) && editingId !== c.id && (
                      <button
                        onClick={() => startEdit(c)}
                        aria-label="Edit"
                        className="neo-button-icon flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-primary font-medium min-h-[28px]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(c.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="flex-1 bg-transparent border-b border-border text-xs outline-none"
                      />
                      <button onClick={() => saveEdit(c.id)} aria-label="Save" className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full">
                        <Check className="w-4 h-4 text-primary" />
                      </button>
                      <button onClick={cancelEdit} aria-label="Cancel" className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : c.voice_url ? (
                    <div className="mt-1">
                      <VoiceNotePlayer src={c.voice_url} durationSec={c.voice_duration_seconds ?? undefined} />
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/80">
                      {c.text}
                      {c.edited && <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {!showAll && commentList.length > 3 && (
              <button onClick={() => setShowAll(true)} className="text-xs text-primary font-medium">
                View all {commentList.length} comments
              </button>
            )}
            {commentList.length === 0 && (
              <p className="text-xs text-muted-foreground">Be the first to comment</p>
            )}
          </div>
          {user ? (
            <CommentComposer
              value={newComment}
              onChange={setNewComment}
              onSubmit={handlePostComment}
              onSubmitVoice={handlePostVoice}
            />
          ) : (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">Sign in to comment</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SongCard;
