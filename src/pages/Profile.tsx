import { Settings, ChevronDown, Menu, Plus, Grid3X3, Film, UserSquare2, Link as LinkIcon, Bookmark } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const highlights = [
  { id: 0, name: "My Story", isAdd: true },
  { id: 1, name: "Travels", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop", emoji: "🏔️" },
  { id: 2, name: "Cool", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=100&h=100&fit=crop", emoji: "😎" },
  { id: 3, name: "Scot", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=100&h=100&fit=crop", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: 4, name: "Holidays", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=100&h=100&fit=crop", emoji: "🌴" },
];

const userPosts = [
  { image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop", color: "bg-orange-400" },
  { image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", color: "bg-blue-400" },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop", color: "bg-red-400" },
  { image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop", color: "bg-yellow-400" },
  { image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop", color: "bg-teal-400" },
  { image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", color: "bg-green-400" },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button className="p-2 hover:opacity-60 transition-opacity">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <span className="font-semibold">qd019el</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <button className="p-2 hover:opacity-60 transition-opacity">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {/* Profile Stats */}
        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-center">
            <p className="font-bold text-lg">16.8k</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-foreground overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center">
            <p className="font-bold text-lg">99</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Bio */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-lg">Adel Dafi <span className="font-normal text-muted-foreground">|</span> <span className="font-normal">Developer</span></h2>
          <p className="text-sm text-muted-foreground mt-1">
            Developer #web #software #mobileDev | #graphicdesigner<br />
            #Artist | 🇫🇷 | #fullstackdeveloper
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center mb-6">
          <button className="action-button action-button-outline">
            Edit profile
          </button>
          <button className="action-button action-button-outline">
            Statistics
          </button>
          <button className="action-button action-button-primary">
            Contact
          </button>
        </div>

        {/* Highlights */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 mb-4">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              {highlight.isAdd ? (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center bg-card">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                  <img src={highlight.image} alt={highlight.name} className="w-full h-full object-cover" />
                </div>
              )}
              <span className="text-xs font-medium">{highlight.name}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-2">
          <button className="flex-1 py-3 flex justify-center border-b-2 border-foreground -mb-px">
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button className="flex-1 py-3 flex justify-center opacity-50">
            <Film className="w-5 h-5" />
          </button>
          <button className="flex-1 py-3 flex justify-center opacity-50">
            <UserSquare2 className="w-5 h-5" />
          </button>
          <button className="flex-1 py-3 flex justify-center opacity-50">
            <LinkIcon className="w-5 h-5" />
          </button>
          <button className="flex-1 py-3 flex justify-center opacity-50">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-1">
          {userPosts.map((post, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
