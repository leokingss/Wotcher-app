import { useState } from "react";
import { MessageCircle, Send, Bookmark, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import ReactionButton from "./ReactionButton";
import { useComments } from "@/hooks/useComments";
import { mockSongComments, Comment } from "@/data/mockComments";
import CommentList from "./CommentList";
import CommentComposer from "./CommentComposer";
import CommentPreview from "./CommentPreview";
import { usePlayer } from "@/hooks/usePlayer";

interface SongCardProps {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  likes: number;
  comments: number;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
}

const SongCard = ({ id, title, artist, duration, cover, likes, comments, isCommentsOpen, onToggleComments }: SongCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(comments);
  const { playingId, toggle } = usePlayer();
  const isPlaying = playingId === id;

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
  } = useComments<Comment>(mockSongComments);

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
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        <span className="text-xs text-muted-foreground">{duration}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
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

      {!isCommentsOpen && (
        <CommentPreview
          comments={commentList}
          totalCount={commentCount}
          onViewAll={onToggleComments}
        />
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
          <CommentComposer
            value={newComment}
            onChange={setNewComment}
            onSubmit={handlePostComment}
          />
        </div>
      )}
    </div>
  );
};

export default SongCard;
