import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import CloudPost from "./CloudPost";
import EmptyState from "./EmptyState";
import { usePosts } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";

const THRESHOLD = 70;

const Feed = () => {
  const { posts, loading, refresh } = usePosts();
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
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" message="Be the first to share something." />
      ) : (
        posts.map((post) => <CloudPost key={post.id} post={post} onReactionChanged={refresh} />)
      )}
    </div>
  );
};

export default Feed;
