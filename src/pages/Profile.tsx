import { Grid3X3, Bookmark, UserSquare2, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const userPosts = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1682695797873-aa4cb6edd613?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
];

const highlights = [
  { id: 1, name: "Travel", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop" },
  { id: 2, name: "Food", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop" },
  { id: 3, name: "Nature", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop" },
  { id: 4, name: "Life", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=100&h=100&fit=crop" },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h1 className="font-semibold text-lg">johndoe</h1>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-5">
            <button className="hover:opacity-60 transition-opacity">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Profile Info */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="story-ring">
              <div className="story-ring-inner">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 pt-2">
              <div className="flex justify-around text-center">
                <div>
                  <p className="font-semibold text-lg">156</p>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">12.4K</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">892</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <h2 className="font-semibold text-sm">John Doe</h2>
            <p className="text-sm text-muted-foreground">Photographer & Creator</p>
            <p className="text-sm mt-1">
              📷 Capturing moments that matter<br />
              🌍 Travel enthusiast<br />
              ✉️ hello@johndoe.com
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-secondary hover:bg-secondary/80 transition-colors font-semibold text-sm py-1.5 rounded-lg">
              Edit profile
            </button>
            <button className="flex-1 bg-secondary hover:bg-secondary/80 transition-colors font-semibold text-sm py-1.5 rounded-lg">
              Share profile
            </button>
          </div>
        </div>

        {/* Highlights */}
        <div className="px-4 py-2">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border border-border overflow-hidden">
                  <img src={highlight.image} alt={highlight.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs">{highlight.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border mt-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex justify-center ${activeTab === 'posts' ? 'border-t border-foreground -mt-px' : ''}`}
          >
            <Grid3X3 className={`w-6 h-6 ${activeTab === 'posts' ? '' : 'opacity-50'}`} />
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 flex justify-center ${activeTab === 'saved' ? 'border-t border-foreground -mt-px' : ''}`}
          >
            <Bookmark className={`w-6 h-6 ${activeTab === 'saved' ? '' : 'opacity-50'}`} />
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex justify-center ${activeTab === 'tagged' ? 'border-t border-foreground -mt-px' : ''}`}
          >
            <UserSquare2 className={`w-6 h-6 ${activeTab === 'tagged' ? '' : 'opacity-50'}`} />
          </button>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {userPosts.map((post, index) => (
            <div key={index} className="aspect-square">
              <img src={post} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
