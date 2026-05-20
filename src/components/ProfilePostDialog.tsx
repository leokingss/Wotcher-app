import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, MoreHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CommentSection from "./CommentSection";
import type { FeedPost } from "@/hooks/usePosts";

interface Props {
  posts: FeedPost[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const formatCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

const ProfilePostDialog = ({ posts, index, onClose, onIndexChange }: Props) => {
  const open = index !== null;
  const post = index !== null ? posts[index] : null;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeBump, setLikeBump] = useState(0);
  const [showDoubleHeart, setShowDoubleHeart] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLiked(post.my_reaction === "like");
    setDisliked(post.my_reaction === "dislike");
    setLikeBump(post.like_count);
    setSaved(false);
  }, [post?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index! > 0) onIndexChange(index! - 1);
      else if (e.key === "ArrowRight" && index! < posts.length - 1) onIndexChange(index! + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, posts.length, onClose, onIndexChange]);

  if (!post) return null;

  const handleLike = () => {
    if (disliked) setDisliked(false);
    setLiked((v) => {
      setLikeBump((c) => c + (v ? -1 : 1));
      return !v;
    });
  };

  const handleDislike = () => {
    if (liked) {
      setLiked(false);
      setLikeBump((c) => c - 1);
    }
    setDisliked((v) => !v);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeBump((c) => c + 1);
    }
    setShowDoubleHeart(true);
    setTimeout(() => setShowDoubleHeart(false), 800);
  };

  const username = post.profile?.username ?? "user";
  const displayName = post.profile?.display_name ?? username;
  const avatar = post.profile?.avatar_url ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-5xl w-[96vw] md:w-[92vw] h-[92vh] md:h-[88vh] bg-background border-none overflow-hidden rounded-2xl"
      >
        {/* Prev/Next */}
        {index! > 0 && (
          <button
            aria-label="Previous"
            onClick={() => onIndexChange(index! - 1)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-40 neo-button-icon w-10 h-10 items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {index! < posts.length - 1 && (
          <button
            aria-label="Next"
            onClick={() => onIndexChange(index! + 1)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-40 neo-button-icon w-10 h-10 items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col md:flex-row h-full w-full">
          {/* Media */}
          <div
            className="relative bg-black flex items-center justify-center md:flex-1 md:max-w-[60%] h-[45vh] md:h-full select-none"
            onDoubleClick={handleDoubleTap}
          >
            <img
              src={post.image_url}
              alt={post.caption ?? "Post"}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
            <AnimatePresence>
              {showDoubleHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 min-h-0 bg-card">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="neo-button-icon p-0.5 flex-shrink-0">
                  <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  {post.location && (
                    <p className="text-xs text-muted-foreground truncate">{post.location}</p>
                  )}
                </div>
              </div>
              <button className="neo-button-icon p-2">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Caption + Comments */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
              {post.caption && (
                <div className="flex gap-3">
                  <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold mr-1.5">{username}</span>
                    <span className="text-foreground/90">{post.caption}</span>
                  </div>
                </div>
              )}
              <CommentSection isOpen={true} postId={post.id} />
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleLike}
                    whileTap={{ scale: 0.85 }}
                    animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="neo-button-icon p-2.5"
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  </motion.button>
                  <motion.button
                    onClick={handleDislike}
                    whileTap={{ scale: 0.85 }}
                    animate={disliked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="neo-button-icon p-2.5"
                  >
                    <HeartCrack className={`w-5 h-5 ${disliked ? "fill-red-500 text-red-900" : ""}`} />
                  </motion.button>
                  <button className="neo-button-icon p-2.5">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button className="neo-button-icon p-2.5">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => setSaved((s) => !s)} className="neo-button-icon p-2.5">
                  <Bookmark className={`w-5 h-5 ${saved ? "fill-primary text-primary" : ""}`} />
                </button>
              </div>
              <p className="text-sm font-semibold">{formatCount(Math.max(0, likeBump))} likes</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePostDialog;
