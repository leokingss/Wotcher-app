import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import CloudCommentSection from "./CloudCommentSection";
import PostContextMenu from "./PostContextMenu";
import { FeedPost, togglePostReaction } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  post: FeedPost;
  onReactionChanged?: () => void;
}

const CloudPost = ({ post, onReactionChanged }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.my_reaction === "like");
  const [isDisliked, setIsDisliked] = useState(post.my_reaction === "dislike");
  const [isSaved, setIsSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [dislikeCount, setDislikeCount] = useState(post.dislike_count);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);

  const requireAuth = () => {
    if (!user) {
      toast.error("Sign in to react");
      navigate("/auth");
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    const wasLiked = isLiked, wasDisliked = isDisliked;
    if (wasDisliked) {
      setIsDisliked(false);
      setDislikeCount((c) => c - 1);
    }
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    await togglePostReaction(post.id, user!.id, post.my_reaction, "like");
    onReactionChanged?.();
  };

  const handleDislike = async () => {
    if (!requireAuth()) return;
    const wasLiked = isLiked, wasDisliked = isDisliked;
    if (wasLiked) {
      setIsLiked(false);
      setLikeCount((c) => c - 1);
    }
    setIsDisliked(!wasDisliked);
    setDislikeCount((c) => (wasDisliked ? c - 1 : c + 1));
    await togglePostReaction(post.id, user!.id, post.my_reaction, "dislike");
    onReactionChanged?.();
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const formatLikes = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));
  const username = post.profile?.username ?? "user";
  const avatar = post.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  return (
    <PostContextMenu label={`@${username}'s post`}>
      <article className="post-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="neo-button-icon p-0.5">
              <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-sm">{username}</p>
              {post.location && <p className="text-xs text-muted-foreground">{post.location}</p>}
            </div>
          </div>
          <button className="neo-button-icon p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div
          className="relative aspect-[4/5] bg-muted cursor-pointer mx-4 rounded-2xl overflow-hidden neo-card-inset"
          onDoubleClick={handleDoubleTap}
        >
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 text-primary fill-primary double-tap-heart drop-shadow-lg" />
            </div>
          )}
        </div>

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
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <AnimatePresence>
                    {isLiked &&
                      [...Array(6)].map((_, i) => {
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
                  className="neo-button-icon p-2.5 relative overflow-visible"
                >
                  <motion.div
                    animate={isDisliked ? { x: [0, -2, 2, -1, 0] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="relative"
                  >
                    <HeartCrack className={`w-5 h-5 ${isDisliked ? "fill-red-500 text-red-900" : ""}`} />
                    <AnimatePresence>
                      {isDisliked && (
                        <motion.svg
                          key="crack"
                          viewBox="0 0 24 24"
                          className="absolute inset-0 w-5 h-5 pointer-events-none overflow-visible"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, times: [0, 0.15, 0.75, 1] }}
                        >
                          <motion.path
                            d="M13 4 L10 11 L14 12 L9 21"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-500"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.38, ease: [0.7, 0, 0.3, 1] }}
                            style={{ filter: "drop-shadow(0 0 3px rgba(239,68,68,0.7))" }}
                          />
                          <motion.circle
                            cx="13"
                            cy="4"
                            r="0.5"
                            className="fill-red-500"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: [0, 6, 8], opacity: [1, 0.6, 0] }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            style={{ transformOrigin: "13px 4px" }}
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
                <span className="text-sm font-medium">{dislikeCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`neo-button-icon p-2.5 ${showComments ? "neo-card-inset text-primary" : ""}`}
                >
                  <MessageCircle className={`w-5 h-5 ${showComments ? "fill-primary" : ""}`} />
                </button>
                <span className="text-sm font-medium">{commentCount}</span>
              </div>
              <button className="neo-button-icon p-2.5">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <button onClick={() => setIsSaved(!isSaved)} className="neo-button-icon p-2.5">
              <Bookmark className={`w-5 h-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          {post.caption && (
            <p className="text-sm">
              <span className="font-semibold">{username}</span>{" "}
              <span className="text-muted-foreground">{post.caption}</span>
            </p>
          )}
        </div>

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
              <CloudCommentSection isOpen={true} postId={post.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </PostContextMenu>
  );
};

export default CloudPost;
