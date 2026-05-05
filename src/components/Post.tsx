import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import CommentSection from "./CommentSection";
import PostContextMenu from "./PostContextMenu";

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
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

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
    <article className="post-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="neo-button-icon p-0.5">
            <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-sm">{username}</p>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>
        <button className="neo-button-icon p-2">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-[4/5] bg-muted cursor-pointer mx-4 rounded-2xl overflow-hidden neo-card-inset"
        onDoubleClick={handleDoubleTap}
      >
        <img 
          src={image} 
          alt="Post" 
          className="w-full h-full object-cover"
        />
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-primary fill-primary double-tap-heart drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <motion.button
                onClick={handleLike}
                whileTap={{ scale: 0.85 }}
                animate={isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="neo-button-icon p-2.5 relative"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <AnimatePresence>
                  {isLiked && [...Array(6)].map((_, i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    return (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                        animate={{ opacity: 0, x: Math.cos(angle) * 22, y: Math.sin(angle) * 22, scale: 1 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-red-500 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.button>
              <span className="text-sm font-medium">{formatLikes(likeCount)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.button
                onClick={handleDislike}
                whileTap={{ scale: 0.85 }}
                animate={isDisliked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="neo-button-icon p-2.5"
              >
                <HeartCrack className={`w-5 h-5 ${isDisliked ? 'fill-red-500 text-red-900' : ''}`} />
              </motion.button>
              <span className="text-sm font-medium">{dislikeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`neo-button-icon p-2.5 ${showComments ? 'neo-card-inset text-primary' : ''}`}
              >
                <MessageCircle className={`w-5 h-5 ${showComments ? 'fill-primary' : ''}`} />
              </button>
              <span className="text-sm font-medium">{comments}</span>
            </div>
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

        {/* Liked by */}
        <div className="flex items-center gap-2">
          <div className="neo-card p-1 rounded-full">
            <div className="flex -space-x-2">
              {likedBy.slice(0, 3).map((user, i) => (
                <img 
                  key={i}
                  src={`https://images.unsplash.com/photo-${1494790108377 + i * 1000}-be9c29b29330?w=30&h=30&fit=crop`}
                  alt=""
                  className="w-6 h-6 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            {likedBy.slice(0, 3).join(', ')}...
          </p>
          <button className="action-button action-button-primary text-xs py-1 px-3">
            More
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            key="comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            style={{ overflow: "hidden" }}
          >
            <CommentSection isOpen={true} />
          </motion.div>
        )}
      </AnimatePresence>
      {!showComments && <CommentSection isOpen={false} />}
    </article>
  );
};

export default Post;
