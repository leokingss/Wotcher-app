import { Heart, MessageCircle, Send, Bookmark, Music2, MoreHorizontal } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const reels = [
  {
    id: 1,
    username: "travel_mike",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    video: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1000&fit=crop",
    likes: "124K",
    comments: "1.2K",
    caption: "The most beautiful sunrise I've ever seen 🌅",
    audio: "Original audio",
  },
  {
    id: 2,
    username: "emma_art",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    video: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=1000&fit=crop",
    likes: "89K",
    comments: "892",
    caption: "Art meets nature ✨",
    audio: "Sunset Vibes - Artist",
  },
];

const Reels = () => {
  return (
    <div className="min-h-screen bg-black pb-14">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-white font-bold text-xl">Reels</h1>
          <button className="text-white hover:opacity-70 transition-opacity">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Reels */}
      <div className="snap-y snap-mandatory h-screen overflow-y-scroll hide-scrollbar">
        {reels.map((reel) => (
          <div key={reel.id} className="snap-start h-screen relative">
            {/* Background Image (simulating video) */}
            <img 
              src={reel.video} 
              alt="" 
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* Right Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
              <button className="flex flex-col items-center gap-1">
                <Heart className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">{reel.likes}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-white text-xs font-medium">{reel.comments}</span>
              </button>
              <button>
                <Send className="w-7 h-7 text-white" />
              </button>
              <button>
                <Bookmark className="w-7 h-7 text-white" />
              </button>
              <button>
                <MoreHorizontal className="w-7 h-7 text-white" />
              </button>
              <div className="w-8 h-8 rounded-md border-2 border-white overflow-hidden">
                <img src={reel.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 right-20 bottom-20">
              <div className="flex items-center gap-2 mb-2">
                <img src={reel.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-white font-semibold text-sm">{reel.username}</span>
                <button className="text-white text-sm font-semibold border border-white rounded-md px-3 py-1 ml-2">
                  Follow
                </button>
              </div>
              <p className="text-white text-sm mb-2">{reel.caption}</p>
              <div className="flex items-center gap-2">
                <Music2 className="w-3 h-3 text-white" />
                <p className="text-white text-xs">{reel.audio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Reels;
