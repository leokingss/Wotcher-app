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

const Feed = () => {
  return (
    <div className="max-w-lg mx-auto pb-24">
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
};

export default Feed;
