import { useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import CloudPost from "./CloudPost";
import DropsRail from "./wallet/DropsRail";
import EmptyState from "./EmptyState";
import { usePosts, FeedMode, FeedPost } from "@/hooks/usePosts";
import { ImageIcon } from "lucide-react";
import { FeedFilterState, DEFAULT_FILTER, SHOP_KEYWORDS } from "./FeedFilter";

const THRESHOLD = 70;

interface FeedProps {
  mode?: FeedMode;
  filter?: FeedFilterState;
}

const Feed = ({ mode = "live", filter = DEFAULT_FILTER }: FeedProps) => {
  const { posts, loading, refresh } = usePosts(undefined, mode);

  const filteredPosts = useMemo(() => applyFilter(posts, filter), [posts, filter]);
  const pull = useMotionValue(0);
  const rotate = useTransform(pull, [0, THRESHOLD], [0, 180]);
  const opacity = useTransform(pull, [0, 30, THRESHOLD], [0, 0.6, 1]);
  const startY = useRef<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) pull.set(Math.min(delta * 0.5, 100));
  };
  const onTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull.get() >= THRESHOLD) {
      setRefreshing(true);
      animate(pull, THRESHOLD, { duration: 0.15 });
      await refresh();
      setRefreshing(false);
      animate(pull, 0, { duration: 0.3 });
    } else {
      animate(pull, 0, { duration: 0.25 });
    }
  };

  return (
    <div
      className="max-w-lg mx-auto pb-24 relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <motion.div style={{ height: pull, opacity }} className="flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ rotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : undefined}
          className="neo-button-icon p-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>

      {loading ? (
        <div className="space-y-6 px-4 pt-2" aria-label="Loading feed">
          {[0, 1, 2].map((i) => (
            <div key={i} className="neo-card p-4 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="neo-skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="neo-skeleton h-3 w-1/3 rounded" />
                  <div className="neo-skeleton h-2 w-1/4 rounded" />
                </div>
              </div>
              <div className="neo-skeleton aspect-[4/5] w-full rounded-2xl" />
              <div className="flex gap-3">
                <div className="neo-skeleton h-8 w-16 rounded-full" />
                <div className="neo-skeleton h-8 w-16 rounded-full" />
                <div className="neo-skeleton h-8 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={posts.length === 0 ? "No posts yet" : "Nothing matches"}
          description={posts.length === 0 ? "Be the first to share something." : "Try adjusting your filter."}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          <DropsRail />
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <CloudPost post={post} onReactionChanged={refresh} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const applyFilter = (posts: FeedPost[], f: FeedFilterState): FeedPost[] => {
  return posts.filter((p) => {
    if (f.category === "shop" && !p.listing) return false;
    if (f.category === "music" && p.media_type !== "audio") return false;
    if (f.category === "video" && p.media_type !== "video") return false;
    if (f.category === "photos" && (p.listing || p.media_type !== "image")) return false;

    if ((f.category === "all" || f.category === "photos") && p.media_type === "image" && !p.listing) {
      if (f.photos.hasCaption && !(p.caption && p.caption.trim().length > 0)) return false;
      if (f.photos.hasLocation && !(p.location && p.location.trim().length > 0)) return false;
      if (f.photos.onlyWithComments && p.comment_count <= 0) return false;
      // onlyFollowing requires follow data we don't have here — best-effort skipped
    }

    if (p.listing && (f.category === "all" || f.category === "shop")) {
      if (!f.shop.types.includes(p.listing.type)) return false;
      if (!f.shop.statuses.includes(p.listing.status as any)) return false;
      if (f.shop.categories.length > 0) {
        const hay = `${p.listing.title ?? ""} ${p.caption ?? ""}`.toLowerCase();
        const matches = f.shop.categories.some((cat) => {
          const kws = SHOP_KEYWORDS[cat] ?? [];
          if (cat === "other") {
            // matches when no other category matched
            const otherCats = f.shop.categories.filter((c) => c !== "other");
            const anyOther = otherCats.some((c) => (SHOP_KEYWORDS[c] ?? []).some((k) => hay.includes(k)));
            return !anyOther;
          }
          return kws.some((k) => hay.includes(k));
        });
        if (!matches) return false;
      }
    }

    return true;
  });
};

export default Feed;
