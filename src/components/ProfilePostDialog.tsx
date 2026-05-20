import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
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

interface ItemProps {
  post: FeedPost;
  onVisible: () => void;
}

const PostItem = ({ post, onVisible }: ItemProps) => {
  const ref = useRef<HTMLElement>(null);
  const [liked, setLiked] = useState(post.my_reaction === "like");
  const [disliked, setDisliked] = useState(post.my_reaction === "dislike");
  const [saved, setSaved] = useState(false);
  const [likeBump, setLikeBump] = useState(post.like_count);
  const [showDoubleHeart, setShowDoubleHeart] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) onVisible();
      },
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

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
  const avatar =
    post.profile?.avatar_url ??
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop";

  return (
    <article
      ref={ref}
      data-post-id={post.id}
      className="snap-start min-h-full w-full border-b border-border/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
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

      {/* Media */}
      <div
        className="relative bg-black flex items-center justify-center select-none"
        onDoubleClick={handleDoubleTap}
      >
        <img
          src={post.image_url}
          alt={post.caption ?? "Post"}
          className="w-full max-h-[65vh] object-contain"
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

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
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
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-1.5">{username}</span>
            <span className="text-foreground/90">{post.caption}</span>
          </p>
        )}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Top 3 comments */}
      <CommentSection isOpen={true} postId={post.id} />
    </article>
  );
};

const ProfilePostDialog = ({ posts, index, onClose, onIndexChange }: Props) => {
  const open = index !== null;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  // Scroll to the clicked post when dialog opens
  useEffect(() => {
    if (!open) {
      didInitialScroll.current = false;
      return;
    }
    if (didInitialScroll.current) return;
    const scroller = scrollerRef.current;
    if (!scroller || index === null) return;
    // wait for items to render
    requestAnimationFrame(() => {
      const target = scroller.querySelector<HTMLElement>(
        `[data-post-id="${posts[index]?.id}"]`
      );
      if (target) {
        scroller.scrollTo({ top: target.offsetTop, behavior: "auto" });
        didInitialScroll.current = true;
      }
    });
  }, [open, index, posts]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (index === null) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-2xl w-[96vw] h-[92vh] bg-background border-none overflow-hidden rounded-2xl flex flex-col">
        <div
          ref={scrollerRef}
          className="flex-1 min-h-0 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {posts.map((p, i) => (
            <PostItem
              key={p.id}
              post={p}
              onVisible={() => {
                if (i !== index) onIndexChange(i);
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePostDialog;
