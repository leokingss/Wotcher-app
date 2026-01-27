import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface PostProps {
  username: string;
  avatar: string;
  image: string;
  likes: number;
  caption: string;
  comments: number;
  timeAgo: string;
}

const Post = ({ username, avatar, image, likes, caption, comments, timeAgo }: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <article className="bg-background border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="story-ring">
            <div className="story-ring-inner">
              <img src={avatar} alt={username} className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          <span className="font-semibold text-sm">{username}</span>
        </div>
        <button className="hover:opacity-60 transition-opacity">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-square bg-muted cursor-pointer"
        onDoubleClick={handleDoubleTap}
      >
        <img 
          src={image} 
          alt="Post" 
          className="w-full h-full object-cover"
        />
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-white fill-white double-tap-heart drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`hover:opacity-60 transition-all ${isLiked ? 'like-animation' : ''}`}
            >
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </button>
            <button className="hover:opacity-60 transition-opacity">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className="hover:opacity-60 transition-opacity"
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-foreground' : ''}`} />
          </button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likeCount.toLocaleString()} likes</p>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold">{username}</span>{" "}
          <span className="text-foreground">{caption}</span>
        </p>

        {/* Comments */}
        {comments > 0 && (
          <button className="text-muted-foreground text-sm mt-1">
            View all {comments} comments
          </button>
        )}

        {/* Time */}
        <p className="text-muted-foreground text-[10px] uppercase mt-1">{timeAgo}</p>
      </div>
    </article>
  );
};

export default Post;
