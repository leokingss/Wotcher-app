import { useState } from "react";
import { Send, Heart, HeartCrack } from "lucide-react";

interface Comment {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
}

interface CommentSectionProps {
  isOpen: boolean;
  postId?: string;
}

const mockComments: Comment[] = [
  {
    id: 1,
    username: "sarah_designs",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop",
    text: "This is absolutely stunning! 🔥",
    time: "2h",
    likes: 12,
    dislikes: 0,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: 2,
    username: "mike_photos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    text: "Love the composition here",
    time: "1h",
    likes: 8,
    dislikes: 1,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: 3,
    username: "creative_jane",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
    text: "Where was this taken?",
    time: "45m",
    likes: 3,
    dislikes: 0,
    isLiked: false,
    isDisliked: false,
  },
];

const CommentSection = ({ isOpen }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      username: "you",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
      text: newComment,
      time: "now",
      likes: 0,
      dislikes: 0,
      isLiked: false,
      isDisliked: false,
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");
    setShowAll(true);
  };

  const handleLikeComment = (commentId: number) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        
        if (comment.isLiked) {
          return { ...comment, isLiked: false, likes: comment.likes - 1 };
        } else {
          return {
            ...comment,
            isLiked: true,
            likes: comment.likes + 1,
            isDisliked: false,
            dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
          };
        }
      })
    );
  };

  const handleDislikeComment = (commentId: number) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        
        if (comment.isDisliked) {
          return { ...comment, isDisliked: false, dislikes: comment.dislikes - 1 };
        } else {
          return {
            ...comment,
            isDisliked: true,
            dislikes: comment.dislikes + 1,
            isLiked: false,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes,
          };
        }
      })
    );
  };

  if (!isOpen) return null;

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-3">
        {/* Comments List */}
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
                <p className="text-sm">
                  <span className="font-semibold">{comment.username}</span>{" "}
                  <span className="text-muted-foreground">{comment.text}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{comment.time}</p>
              </div>
              {/* Like/Dislike buttons side by side */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="flex items-center gap-1"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{comment.likes}</span>
                </button>
                <button
                  onClick={() => handleDislikeComment(comment.id)}
                  className="flex items-center gap-1"
                >
                  <HeartCrack
                    className={`w-3.5 h-3.5 ${comment.isDisliked ? 'fill-red-500 text-red-900' : 'text-muted-foreground'}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{comment.dislikes}</span>
                </button>
              </div>
            </div>
          ))}
          {!showAll && comments.length > 3 && (
            <button 
              onClick={() => setShowAll(true)}
              className="text-xs text-primary font-medium"
            >
              View all {comments.length} comments
            </button>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-border/30">
          <div className="neo-card p-0.5 rounded-full">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop"
              alt="You"
              className="w-7 h-7 rounded-full object-cover"
            />
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="neo-button-icon p-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
