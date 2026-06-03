import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, X } from "lucide-react";
import ReactionButton from "./ReactionButton";
import CommentComposer from "./CommentComposer";
import CommentPreview from "./CommentPreview";
import { useComments } from "@/hooks/useComments";
import { mockPostComments, RichComment } from "@/data/mockComments";

interface CommentSectionProps {
  isOpen: boolean;
  postId?: string;
}

const CommentSection = ({ isOpen }: CommentSectionProps) => {
  const navigate = useNavigate();
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

  const handleSubmit = () => {
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
    return (
      <div className="px-4 pb-3">
        <CommentPreview comments={comments} framed={false} />
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
                  <div className="flex items-center gap-1.5">
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
                    <button
                      onClick={() => saveEdit(comment.id)}
                      aria-label="Save edit"
                      className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      aria-label="Cancel edit"
                      className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm">
                    <button onClick={() => navigate(`/profile/${comment.username}`)} className="font-semibold hover:underline">
                      {comment.username}
                    </button>{" "}
                    <span className="text-muted-foreground">{comment.text}</span>
                    {comment.edited && (
                      <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>
                    )}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{comment.time}</p>
                  {canEdit(comment) && editingId !== comment.id && (
                    <button
                      onClick={() => startEdit(comment)}
                      aria-label="Edit comment"
                      className="neo-button-icon flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-primary font-medium min-h-[28px]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ReactionButton type="like" active={comment.isLiked} count={comment.likes} size="sm" onClick={() => handleLikeComment(comment.id)} />
                <ReactionButton type="dislike" active={comment.isDisliked} count={comment.dislikes} size="sm" onClick={() => handleDislikeComment(comment.id)} />
              </div>
            </div>
          ))}
          {!showAll && comments.length > 3 && (
            <button onClick={() => setShowAll(true)} className="text-xs text-primary font-medium">
              View all {comments.length} comments
            </button>
          )}
        </div>

        <CommentComposer
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmit}
          variant="bordered"
        />
      </div>
    </div>
  );
};

export default CommentSection;
