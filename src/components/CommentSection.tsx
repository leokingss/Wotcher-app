import { useState } from "react";
import { Send, Heart, HeartCrack, Pencil, Check, X } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { mockPostComments, RichComment, CURRENT_USER_AVATAR } from "@/data/mockComments";

interface CommentSectionProps {
  isOpen: boolean;
  postId?: string;
}

const CommentSection = ({ isOpen }: CommentSectionProps) => {
  const {
    comments,
    setComments,
    editingId,
    editText,
    setEditText,
    canEdit,
    startEdit,
    cancelEdit,
    saveEdit,
    addComment,
  } = useComments<RichComment>(mockPostComments);

  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(newComment, { likes: 0, dislikes: 0, isLiked: false, isDisliked: false });
    setNewComment("");
    setShowAll(true);
  };

  const handleLikeComment = (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        if (c.isLiked) return { ...c, isLiked: false, likes: c.likes - 1 };
        return {
          ...c,
          isLiked: true,
          likes: c.likes + 1,
          isDisliked: false,
          dislikes: c.isDisliked ? c.dislikes - 1 : c.dislikes,
        };
      })
    );
  };

  const handleDislikeComment = (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        if (c.isDisliked) return { ...c, isDisliked: false, dislikes: c.dislikes - 1 };
        return {
          ...c,
          isDisliked: true,
          dislikes: c.dislikes + 1,
          isLiked: false,
          likes: c.isLiked ? c.likes - 1 : c.likes,
        };
      })
    );
  };

  if (!isOpen) {
    const previewComments = comments.slice(0, 2);
    return (
      <div className="px-4 pb-3">
        <div className="space-y-2">
          {previewComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="neo-card p-0.5 rounded-full">
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              </div>
              <p className="text-xs flex-1 min-w-0">
                <span className="font-semibold">{comment.username}</span>{" "}
                <span className="text-muted-foreground">{comment.text}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-3">
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="neo-card p-0.5 rounded-full">
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="w-7 h-7 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === comment.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(comment.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                      className="flex-1 bg-transparent border-b border-border text-sm outline-none"
                    />
                    <button onClick={() => saveEdit(comment.id)} className="p-1">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button onClick={cancelEdit} className="p-1">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm">
                    <span className="font-semibold">{comment.username}</span>{" "}
                    <span className="text-muted-foreground">{comment.text}</span>
                    {comment.edited && (
                      <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>
                    )}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{comment.time}</p>
                  {canEdit(comment) && editingId !== comment.id && (
                    <button
                      onClick={() => startEdit(comment)}
                      className="flex items-center gap-0.5 text-xs text-primary font-medium"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleLikeComment(comment.id)} className="flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] text-muted-foreground">{comment.likes}</span>
                </button>
                <button onClick={() => handleDislikeComment(comment.id)} className="flex items-center gap-1">
                  <HeartCrack className={`w-3.5 h-3.5 ${comment.isDisliked ? 'fill-red-500 text-red-900' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] text-muted-foreground">{comment.dislikes}</span>
                </button>
              </div>
            </div>
          ))}
          {!showAll && comments.length > 3 && (
            <button onClick={() => setShowAll(true)} className="text-xs text-primary font-medium">
              View all {comments.length} comments
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-border/30">
          <div className="neo-card p-0.5 rounded-full">
            <img src={CURRENT_USER_AVATAR} alt="You" className="w-7 h-7 rounded-full object-cover" />
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" disabled={!newComment.trim()} className="neo-button-icon p-2 disabled:opacity-50">
            <Send className="w-4 h-4 text-primary" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
