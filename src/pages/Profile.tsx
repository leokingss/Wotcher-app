import { useState } from "react";
import { Settings, ChevronDown, Menu, Plus, Grid3X3, Music, Film, UserSquare2, Link as LinkIcon, Bookmark, ChevronRight, Play, Square } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import SongCard from "@/components/SongCard";
import VideoCard from "@/components/VideoCard";

const featuredSongs = [
  { id: 1, title: "Midnight Dreams", artist: "Luna Wave", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop" },
  { id: 2, title: "Electric Sunrise", artist: "Neon Pulse", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop" },
];

const userPosts = [
  { image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop" },
  { image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop" },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop" },
  { image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop" },
  { image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop" },
  { image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
];

const playlist = [
  { id: 1, title: "Midnight Dreams", artist: "Luna Wave", duration: "3:45", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop", likes: 48, comments: 12 },
  { id: 2, title: "Electric Sunrise", artist: "Neon Pulse", duration: "4:12", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop", likes: 125, comments: 34 },
  { id: 3, title: "Ocean Waves", artist: "Calm Beats", duration: "3:28", cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&h=100&fit=crop", likes: 89, comments: 21 },
  { id: 4, title: "City Lights", artist: "Urban Echo", duration: "4:02", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop", likes: 256, comments: 45 },
  { id: 5, title: "Summer Breeze", artist: "Chill Vibes", duration: "3:55", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop", likes: 178, comments: 28 },
];

const videos = [
  { id: 101, title: "Mountain Hiking Adventure", duration: "2:34", thumbnail: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop", likes: 342, comments: 56, views: "12.4k" },
  { id: 102, title: "Sunset Timelapse Collection", duration: "1:48", thumbnail: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=300&fit=crop", likes: 589, comments: 87, views: "28.7k" },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);

  const handleToggleComments = (itemId: number) => {
    setOpenCommentsId(openCommentsId === itemId ? null : itemId);
  };

  const handleTogglePlay = (songId: number) => {
    setPlayingSongId(playingSongId === songId ? null : songId);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button className="neo-button-icon w-10 h-10 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
          <button className="neo-button px-4 py-2 rounded-full flex items-center gap-1.5">
            <span className="font-semibold text-sm">qd019el</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="neo-button-icon w-10 h-10 flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {/* Profile Stats */}
        <div className="flex items-center justify-center gap-8 py-6">
          <div className="neo-card-inset px-4 py-3 rounded-2xl text-center">
            <p className="font-bold text-lg">16.8k</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          
          <div className="relative">
            <div className="neo-card p-1 rounded-full">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="neo-card-inset px-4 py-3 rounded-2xl text-center">
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
        <div className="flex gap-3 justify-center mb-6">
          <button className="neo-button px-5 py-2 rounded-full text-sm font-medium">
            Edit profile
          </button>
          <button className="neo-button px-5 py-2 rounded-full text-sm font-medium">
            Statistics
          </button>
          <button className="action-button action-button-primary">
            Contact
          </button>
        </div>

        {/* Featured Songs - stacked vertically */}
        <div className="flex flex-col gap-0.5 mb-4">
          {featuredSongs.map((song) => (
            <div 
              key={song.id} 
              className="flex items-center gap-2 py-1"
            >
              <div className="neo-card p-0.5 rounded-lg">
                <img src={song.cover} alt={song.title} className="w-8 h-8 rounded-md object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate">{song.title}</p>
                <span className="text-muted-foreground text-xs">•</span>
                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
              <button 
                onClick={() => handleTogglePlay(song.id)}
                className="neo-button-icon w-8 h-8 flex items-center justify-center"
              >
                {playingSongId === song.id ? (
                  <Square className="w-3 h-3 fill-primary text-primary" />
                ) : (
                  <Play className="w-3 h-3 fill-foreground text-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Tabs - individual icon buttons spread evenly */}
        <div className="flex justify-between mb-4">
          <button 
            onClick={() => setActiveTab("posts")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "posts" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("music")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "music" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <Music className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("videos")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "videos" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <Film className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("photos")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "photos" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <UserSquare2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("links")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "links" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <LinkIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("saved")}
            className={`neo-button-icon w-11 h-11 flex items-center justify-center ${activeTab === "saved" ? "text-primary neo-card-inset" : "text-muted-foreground"}`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-2">
            {userPosts.map((post, index) => (
              <div key={index} className="neo-card p-1 rounded-xl">
                <img src={post.image} alt="" className="w-full aspect-square object-cover rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "music" && (
          <div className="space-y-3">
            {playlist.map((song) => (
              <SongCard 
                key={song.id} 
                {...song} 
                isCommentsOpen={openCommentsId === song.id}
                onToggleComments={() => handleToggleComments(song.id)}
              />
            ))}
            
            {/* Expand option */}
            <button className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <span>View all music</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === "videos" && (
          <div className="space-y-3">
            {videos.map((video) => (
              <VideoCard 
                key={video.id} 
                {...video} 
                isCommentsOpen={openCommentsId === video.id}
                onToggleComments={() => handleToggleComments(video.id)}
              />
            ))}
            
            {/* Expand option */}
            <button className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <span>View all videos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
