import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface PostProps {
  username: string;
  location: string;
  avatar: string;
  image: string;
  likes: number;
  likedBy: string[];
  caption: string;
  comments: number;
}

const Post = ({ username, location, avatar, image, likes, likedBy, caption, comments }: PostProps) => {
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

  const formatLikes = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <article className="post-card mx-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-sm">{username}</p>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>
        <button className="hover:opacity-60 transition-opacity">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-[4/5] bg-muted cursor-pointer"
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
          <div className="flex items-center gap-5">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 ${isLiked ? 'like-animation' : ''}`}
            >
              <Heart 
                className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span className="text-sm font-medium">{formatLikes(likeCount)}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{comments}</span>
            </button>
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className="hover:opacity-60 transition-opacity"
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-foreground' : ''}`} />
          </button>
        </div>

        {/* Liked by */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {likedBy.slice(0, 3).map((user, i) => (
              <img 
                key={i}
                src={`https://images.unsplash.com/photo-${1494790108377 + i * 1000}-be9c29b29330?w=30&h=30&fit=crop`}
                alt=""
                className="w-5 h-5 rounded-full border-2 border-card object-cover"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {likedBy.slice(0, 3).join(', ')}...
          </p>
          <button className="action-button action-button-primary text-xs py-1 px-3">
            More
          </button>
        </div>
      </div>
    </article>
  );
};

export default Post;
