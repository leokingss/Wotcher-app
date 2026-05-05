import { useState } from "react";
import { MessageCircle, Send, Bookmark, Play } from "lucide-react";
import ReactionButton from "./ReactionButton";
import { useComments } from "@/hooks/useComments";
import { mockVideoComments, Comment } from "@/data/mockComments";
import CommentList from "./CommentList";
import CommentComposer from "./CommentComposer";
import CommentPreview from "./CommentPreview";

interface VideoCardProps {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: string;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
}

const VideoCard = ({ title, duration, thumbnail, likes, comments, views, isCommentsOpen, onToggleComments }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(comments);

  const {
    comments: commentList,
    editingId,
    editText,
    setEditText,
    canEdit,
    startEdit,
    cancelEdit,
    saveEdit,
    addComment,
  } = useComments<Comment>(mockVideoComments);

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

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment);
    setCommentCount(p => p + 1);
    setNewComment("");
  };

  const formatCount = (c: number) => c >= 1000 ? (c / 1000).toFixed(1) + 'k' : c.toString();

  return (
    <div className="neo-card p-3 rounded-xl">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <button className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="neo-button-icon p-4 bg-background/80 backdrop-blur-sm">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </button>
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
          {duration}
        </span>
      </div>

      <div className="mb-3">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{views} views</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <ReactionButton type="like" active={isLiked} count={formatCount(likeCount)} onClick={handleLike} />
          <ReactionButton type="dislike" active={isDisliked} count={dislikeCount} onClick={handleDislike} />
          <button onClick={onToggleComments} className={`neo-button-icon p-2.5 flex items-center gap-1.5 ${isCommentsOpen ? 'neo-card-inset' : ''}`}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
          <button className="neo-button-icon p-2.5">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => setIsSaved(!isSaved)} className="neo-button-icon p-2.5">
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>

      {!isCommentsOpen && commentList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          {commentList.slice(0, 2).map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <img src={comment.avatar} alt={comment.username} className="w-6 h-6 rounded-full object-cover" />
              <p className="text-xs flex-1 min-w-0">
                <span className="font-semibold">{comment.username}</span>{" "}
                <span className="text-muted-foreground">{comment.text}</span>
              </p>
            </div>
          ))}
          {commentList.length > 2 && (
            <button onClick={onToggleComments} className="text-xs text-primary font-medium">
              View all {commentCount} comments
            </button>
          )}
        </div>
      )}

      {isCommentsOpen && (
        <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
          <CommentList
            comments={commentList}
            limit={3}
            canEdit={canEdit}
            editingId={editingId}
            editText={editText}
            onEditTextChange={setEditText}
            onStartEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
          <div className="flex items-center gap-2 neo-card-inset p-2 rounded-xl">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop" alt="You" className="w-7 h-7 rounded-full object-cover" />
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              maxLength={500}
            />
            <button onClick={handlePostComment} disabled={!newComment.trim()} className={`neo-button-icon p-2 ${newComment.trim() ? 'text-primary' : 'opacity-50'}`}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
