import { useState } from "react";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, Play } from "lucide-react";

interface Comment {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
}

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

const mockComments: Comment[] = [
  { id: 1, username: "videostar", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop", text: "Great content! 🎬", time: "1h" },
  { id: 2, username: "filmmaker", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop", text: "Love the editing on this", time: "3h" },
  { id: 3, username: "creator_hub", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop", text: "Keep up the good work!", time: "1d" },
];

const VideoCard = ({ title, duration, thumbnail, likes, comments, views, isCommentsOpen, onToggleComments }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState<Comment[]>(mockComments);
  const [commentCount, setCommentCount] = useState(comments);

  const handleLike = () => {
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount(prev => prev - 1);
    }
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDislike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    }
    setIsDisliked(!isDisliked);
    setDislikeCount(prev => isDisliked ? prev - 1 : prev + 1);
  };

  const handlePostComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now(),
        username: "you",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
        text: newComment.trim(),
        time: "now"
      };
      setCommentList([comment, ...commentList]);
      setCommentCount(prev => prev + 1);
      setNewComment("");
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div className="neo-card p-3 rounded-xl">
      {/* Video Thumbnail */}
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

      {/* Video Info */}
      <div className="mb-3">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{views} views</p>
      </div>
      
      {/* Actions - matching Post.tsx layout */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLike}
            className={`neo-button-icon p-2.5 flex items-center gap-1.5 ${isLiked ? 'like-animation' : ''}`}
          >
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
            />
            <span className="text-sm font-medium">{formatCount(likeCount)}</span>
          </button>
          <button 
            onClick={handleDislike}
            className={`neo-button-icon p-2.5 flex items-center gap-1.5 ${isDisliked ? 'like-animation' : ''}`}
          >
            <HeartCrack 
              className={`w-5 h-5 ${isDisliked ? 'fill-red-500 text-red-900' : ''}`} 
            />
            <span className="text-sm font-medium">{dislikeCount}</span>
          </button>
          <button 
            onClick={onToggleComments}
            className={`neo-button-icon p-2.5 flex items-center gap-1.5 ${isCommentsOpen ? 'neo-card-inset' : ''}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
          <button className="neo-button-icon p-2.5">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button 
          onClick={() => setIsSaved(!isSaved)}
          className="neo-button-icon p-2.5"
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>

      {/* Expandable Comments Section */}
      {isCommentsOpen && (
        <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
          {/* Comments list */}
          <div className="space-y-3 mb-3">
            {commentList.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <img 
                  src={comment.avatar} 
                  alt={comment.username} 
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-xs text-foreground/80">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Write comment */}
          <div className="flex items-center gap-2 neo-card-inset p-2 rounded-xl">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop" 
              alt="You" 
              className="w-7 h-7 rounded-full object-cover"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              maxLength={500}
            />
            <button 
              onClick={handlePostComment}
              disabled={!newComment.trim()}
              className={`neo-button-icon p-2 ${newComment.trim() ? 'text-primary' : 'opacity-50'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
