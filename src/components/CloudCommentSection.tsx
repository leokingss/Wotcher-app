import { useState } from "react";
import { Send, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePostComments } from "@/hooks/usePostComments";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/time";

interface Props {
  isOpen: boolean;
  postId: string;
}

const CloudCommentSection = ({ isOpen, postId }: Props) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { comments, addComment, editingId, editText, setEditText, canEdit, startEdit, cancelEdit, saveEdit } =
    usePostComments(isOpen ? postId : null);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    await addComment(newComment);
    setNewComment("");
    setShowAll(true);
  };

  if (!isOpen) {
    return null;
  }

  const display = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="px-4 pb-4">
      <div className="space-y-3">
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {display.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="neo-card p-0.5 rounded-full">
                <img
                  src={c.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.profile?.username}`}
                  alt={c.profile?.username ?? ""}
                  className="w-7 h-7 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === c.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(c.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                      className="flex-1 bg-transparent border-b border-border text-sm outline-none"
                    />
                    <button onClick={() => saveEdit(c.id)} aria-label="Save" className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full">
                      <Check className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={cancelEdit} aria-label="Cancel" className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm">
                    <button onClick={() => c.profile?.username && navigate(`/profile/${c.profile.username}`)} className="font-semibold hover:underline">
                      {c.profile?.username}
                    </button>{" "}
                    <span className="text-muted-foreground">{c.text}</span>
                    {c.edited && <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{formatRelative(c.created_at)}</p>
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
              </div>
            </div>
          ))}
          {!showAll && comments.length > 3 && (
            <button onClick={() => setShowAll(true)} className="text-xs text-primary font-medium">
              View all {comments.length} comments
            </button>
          )}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">Be the first to comment</p>
          )}
        </div>

        {user ? (
          <form onSubmit={submit} className="flex items-center gap-2 pt-2 border-t border-border/30">
            <div className="neo-card p-0.5 rounded-full">
              <img
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username ?? "you"}`}
                alt="You"
                className="w-7 h-7 rounded-full object-cover"
              />
            </div>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" disabled={!newComment.trim()} className="neo-button-icon p-2 disabled:opacity-50">
              <Send className="w-4 h-4 text-primary" />
            </button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">Sign in to comment</p>
        )}
      </div>
    </div>
  );
};

export default CloudCommentSection;
