import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import Post from "./Post";

const posts = [
  {
    id: 1,
    username: "Camila",
    location: "Mexico City, Mexico",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop",
    likes: 5400,
    likedBy: ["Aaron", "Hank Adams", "John", "William"],
    caption: "Enjoying the sunshine ☀️",
    comments: 165,
  },
  {
    id: 2,
    username: "khokha",
    location: "Tokyo City, Tokyo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=750&fit=crop",
    likes: 3200,
    likedBy: ["Sarah", "Mike", "Emma"],
    caption: "Adventures await 🌏",
    comments: 89,
  },
  {
    id: 3,
    username: "travel_emma",
    location: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop",
    likes: 8700,
    likedBy: ["Alex", "Jordan", "Taylor", "Sam"],
    caption: "Mountain views 🏔️",
    comments: 234,
  },
];

const THRESHOLD = 70;

const Feed = () => {
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
  const onTouchEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull.get() >= THRESHOLD) {
      setRefreshing(true);
      animate(pull, THRESHOLD, { duration: 0.15 });
      setTimeout(() => {
        setRefreshing(false);
        animate(pull, 0, { duration: 0.3 });
      }, 1000);
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
      <motion.div
        style={{ height: pull, opacity }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          style={{ rotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : undefined}
          className="neo-button-icon p-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
};

export default Feed;
