import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartCrack, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, Music as MusicIcon, Film } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CommentSection from "./CommentSection";

export type MediaKind = "photo" | "song" | "video";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  username: string;
  displayName?: string;
  avatar?: string;
  location?: string;
  createdAt?: string;
  caption?: string;
  /** photo image, song cover, or video poster/thumbnail */
  image: string;
  audioUrl?: string;
  videoUrl?: string;
  title?: string;
  artist?: string;
  duration?: string;
  likeCount?: number;
  postId?: string;
}

interface Props {
  items: MediaItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const formatCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

const fallbackAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop";

const MediaBody = ({ item, onDoubleTap }: { item: MediaItem; onDoubleTap: () => void }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  if (item.kind === "video") {
    return (
      <div className="relative bg-black flex items-center justify-center select-none">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            poster={item.image}
            controls
            playsInline
            className="w-full max-h-[65vh] object-contain"
          />
        ) : (
          <div className="relative w-full">
            <img
              src={item.image}
              alt={item.title ?? "Video"}
              className="w-full max-h-[65vh] object-contain"
              onDoubleClick={onDoubleTap}
              draggable={false}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-foreground ml-1" />
              </div>
            </div>
            {item.duration && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-white text-xs">
                <Film className="w-3 h-3" />
                <span>{item.duration}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (item.kind === "song") {
    return (
      <div
        className="relative bg-black flex flex-col items-center justify-center select-none"
        onDoubleClick={onDoubleTap}
      >
        <div className="relative w-full">
          <img
            src={item.image}
            alt={item.title ?? "Song cover"}
            className="w-full max-h-[55vh] object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={toggleAudio}
            className="absolute inset-0 flex items-center justify-center"
            aria-label={playing ? "Pause" : "Play"}
          >
            <span className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transition-transform active:scale-95">
              {playing ? (
                <Pause className="w-9 h-9 text-foreground" />
              ) : (
                <Play className="w-9 h-9 text-foreground ml-1" />
              )}
            </span>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80 mb-1">
              <MusicIcon className="w-3.5 h-3.5" />
              <span>Song</span>
            </div>
            <p className="text-lg font-semibold truncate">{item.title}</p>
            {item.artist && <p className="text-sm opacity-80 truncate">{item.artist}</p>}
          </div>
        </div>
        {item.audioUrl && (
          <audio
            ref={audioRef}
            src={item.audioUrl}
            onEnded={() => setPlaying(false)}
            preload="none"
            className="hidden"
          />
        )}
      </div>
    );
  }

  // photo
  return (
    <div
      className="relative bg-black flex items-center justify-center select-none"
      onDoubleClick={onDoubleTap}
    >
      <img
        src={item.image}
        alt={item.caption ?? "Post"}
        className="w-full max-h-[65vh] object-contain"
        draggable={false}
      />
    </div>
  );
};

interface ItemProps {
  item: MediaItem;
  onVisible: () => void;
}

const PostItem = ({ item, onVisible }: ItemProps) => {
  const ref = useRef<HTMLElement>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeBump, setLikeBump] = useState(item.likeCount ?? 0);
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

  const username = item.username;
  const displayName = item.displayName ?? username;
  const avatar = item.avatar ?? fallbackAvatar;

  return (
    <article
      ref={ref}
      data-media-id={item.id}
      className="snap-start min-h-full w-full border-b border-border/40"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="neo-button-icon p-0.5 flex-shrink-0">
            <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            {item.location && (
              <p className="text-xs text-muted-foreground truncate">{item.location}</p>
            )}
          </div>
        </div>
        <button className="neo-button-icon p-2">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <MediaBody item={item} onDoubleTap={handleDoubleTap} />
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
        {(item.caption || item.title) && (
          <p className="text-sm">
            <span className="font-semibold mr-1.5">{username}</span>
            <span className="text-foreground/90">{item.caption ?? item.title}</span>
          </p>
        )}
        {item.createdAt && (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      <CommentSection isOpen={true} postId={item.postId} />
    </article>
  );
};

const ProfilePostDialog = ({ items, index, onClose, onIndexChange }: Props) => {
  const open = index !== null;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    if (!open) {
      didInitialScroll.current = false;
      return;
    }
    if (didInitialScroll.current) return;
    const scroller = scrollerRef.current;
    if (!scroller || index === null) return;
    requestAnimationFrame(() => {
      const target = scroller.querySelector<HTMLElement>(
        `[data-media-id="${items[index]?.id}"]`
      );
      if (target) {
        scroller.scrollTo({ top: target.offsetTop, behavior: "auto" });
        didInitialScroll.current = true;
      }
    });
  }, [open, index, items]);

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
          {items.map((it, i) => (
            <PostItem
              key={it.id}
              item={it}
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
