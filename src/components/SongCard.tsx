import { useState } from "react";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, Play } from "lucide-react";

interface SongCardProps {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  likes: number;
  comments: number;
}

const SongCard = ({ title, artist, duration, cover, likes, comments }: SongCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);

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

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div className="neo-card p-3 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={cover} alt={title} className="w-12 h-12 rounded-lg object-cover" />
          <button className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <Play className="w-5 h-5 text-white fill-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        <span className="text-xs text-muted-foreground">{duration}</span>
      </div>
      
      {/* Actions - matching Post.tsx layout */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
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
          <button className="neo-button-icon p-2.5 flex items-center gap-1.5">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{comments}</span>
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
    </div>
  );
};

export default SongCard;
