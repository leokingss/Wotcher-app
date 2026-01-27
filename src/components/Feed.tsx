import Post from "./Post";

const posts = [
  {
    id: 1,
    username: "sarah_design",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop",
    likes: 1243,
    caption: "Golden hour magic ✨ Nothing beats these sunset views",
    comments: 89,
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    username: "travel_mike",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
    likes: 3521,
    caption: "Mountains are calling and I must go 🏔️ #wanderlust #adventure",
    comments: 156,
    timeAgo: "5 hours ago",
  },
  {
    id: 3,
    username: "foodie_jane",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
    likes: 892,
    caption: "Homemade pizza night! 🍕 Recipe in bio",
    comments: 67,
    timeAgo: "8 hours ago",
  },
  {
    id: 4,
    username: "alex_photo",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop",
    likes: 5678,
    caption: "Stargazing at its finest. Shot on a clear winter night 🌌",
    comments: 234,
    timeAgo: "12 hours ago",
  },
  {
    id: 5,
    username: "emma_art",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=600&fit=crop",
    likes: 2341,
    caption: "Lake reflections at dawn. Pure serenity 🌅",
    comments: 98,
    timeAgo: "1 day ago",
  },
];

const Feed = () => {
  return (
    <div className="max-w-lg mx-auto">
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
};

export default Feed;
