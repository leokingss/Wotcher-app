import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, Menu, Plus, Grid3X3, Music, Film, UserSquare2, Link as LinkIcon, Bookmark, ChevronRight, Camera, Image, X, ZoomIn, ZoomOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import SongCard from "@/components/SongCard";
import VideoCard from "@/components/VideoCard";
import FeaturedSongRow from "@/components/FeaturedSongRow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import EmptyState from "@/components/EmptyState";
import PostContextMenu from "@/components/PostContextMenu";
import { usePlayer } from "@/hooks/usePlayer";

const tabFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};

const featuredSongs = [
  { 
    id: 1, 
    title: "Midnight Dreams", 
    artist: "Luna Wave", 
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg"
  },
  { 
    id: 2, 
    title: "Electric Sunrise", 
    artist: "Neon Pulse", 
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/forest_night.ogg"
  },
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
  const [profilePhotoDialogOpen, setProfilePhotoDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleToggleComments = (itemId: number) => {
    setOpenCommentsId(openCommentsId === itemId ? null : itemId);
  };

  const player = usePlayer();
  const handleTogglePlay = (songId: number) => {
    const next = playingSongId === songId ? null : songId;
    setPlayingSongId(next);
    const song = featuredSongs.find((s) => s.id === songId) ?? playlist.find((s) => s.id === songId);
    if (song) player.toggle({ id: song.id, title: song.title, artist: song.artist, cover: song.cover });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string);
        setPhotoZoom(1.2); // Start slightly zoomed to allow immediate panning
        setPhotoPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewPhoto) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - photoPosition.x, y: e.clientY - photoPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    // Allow movement based on zoom - more zoom = more movement range
    const maxOffset = Math.max(20, (photoZoom - 0.5) * 64);
    const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y));
    setPhotoPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!previewPhoto) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - photoPosition.x, y: touch.clientY - photoPosition.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const maxOffset = Math.max(20, (photoZoom - 0.5) * 64);
    const newX = Math.max(-maxOffset, Math.min(maxOffset, touch.clientX - dragStart.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, touch.clientY - dragStart.y));
    setPhotoPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSavePhoto = () => {
    if (previewPhoto) {
      // Create a canvas to capture the cropped/zoomed image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      
      const img = new window.Image();
      img.onload = () => {
        if (ctx) {
          const scaledSize = size * photoZoom;
          const offsetX = (size - scaledSize) / 2 + (photoPosition.x / 64) * (scaledSize / 2);
          const offsetY = (size - scaledSize) / 2 + (photoPosition.y / 64) * (scaledSize / 2);
          ctx.drawImage(img, offsetX, offsetY, scaledSize, scaledSize);
          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setProfilePhoto(croppedDataUrl);
        }
        setPreviewPhoto(null);
        setPhotoZoom(1);
        setPhotoPosition({ x: 0, y: 0 });
        setProfilePhotoDialogOpen(false);
      };
      img.src = previewPhoto;
    }
  };

  const handleCancelPhoto = () => {
    setPreviewPhoto(null);
    setPhotoZoom(1);
    setPhotoPosition({ x: 0, y: 0 });
    setProfilePhotoDialogOpen(false);
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
        {/* Profile Stats - hero with grain texture */}
        <div className="grain-overlay rounded-3xl">
        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-center">
            <p className="neo-button px-3 py-1.5 rounded-xl font-bold text-lg mb-1">16.8k</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-md animate-blob-morph" 
                 style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', transform: 'scale(1.1)' }} />
            <div className="neo-card p-1 relative animate-blob-morph" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}>
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-[102px] h-[102px] object-cover animate-blob-morph"
                style={{ borderRadius: '55% 45% 35% 65% / 55% 35% 65% 45%' }}
              />
            </div>
            <button 
              onClick={() => setProfilePhotoDialogOpen(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg z-10"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center">
            <p className="neo-button px-3 py-1.5 rounded-xl font-bold text-lg mb-1">99</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Bio */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-lg"><span className="text-signature">Adel Dafi</span> <span className="font-normal text-muted-foreground">|</span> <span className="font-normal">Developer</span></h2>
          <p className="text-sm text-muted-foreground mt-1">
            Developer #web #software #mobileDev | #graphicdesigner<br />
            #Artist | 🇫🇷 | #fullstackdeveloper
          </p>
        </div>
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
            <FeaturedSongRow
              key={song.id}
              {...song}
              isPlaying={playingSongId === song.id}
              onTogglePlay={handleTogglePlay}
            />
          ))}
          
          {/* More Music Expanding Tab */}
          <button 
            onClick={() => setActiveTab("music")}
            className="neo-button mt-2 py-2 px-4 rounded-full flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Music className="w-3.5 h-3.5" />
            <span>More music</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
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
        <AnimatePresence mode="wait">
        {activeTab === "posts" && (
          <motion.div key="posts" {...tabFade} className="grid grid-cols-3 gap-2">
            {userPosts.map((post, index) => (
              <motion.div
                key={`photo-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="neo-card p-1 rounded-xl group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img src={post.image} alt="" className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              </motion.div>
            ))}
            {playlist.map((song, i) => (
              <motion.div
                key={`song-${song.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (userPosts.length + i) * 0.03 }}
                className="neo-card p-1 rounded-xl relative group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img src={song.cover} alt={song.title} className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Music className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[10px] font-medium text-white truncate drop-shadow-lg">{song.title}</p>
                    <p className="text-[9px] text-white/70 truncate">{song.artist}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {videos.map((video, i) => (
              <motion.div
                key={`video-${video.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (userPosts.length + playlist.length + i) * 0.03 }}
                className="neo-card p-1 rounded-xl relative group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img src={video.thumbnail} alt={video.title} className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/90 backdrop-blur-sm shadow-lg">
                    <Film className="w-3 h-3 text-destructive-foreground" />
                    <span className="text-[9px] font-medium text-destructive-foreground">{video.duration}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
                      <div className="w-0 h-0 border-l-[10px] border-l-foreground border-y-[6px] border-y-transparent ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[10px] font-medium text-white truncate drop-shadow-lg">{video.title}</p>
                    <p className="text-[9px] text-white/70">{video.views} views</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "music" && (
          <motion.div key="music" {...tabFade} className="space-y-3">
            {playlist.map((song) => (
              <SongCard
                key={song.id}
                {...song}
                isCommentsOpen={openCommentsId === song.id}
                onToggleComments={() => handleToggleComments(song.id)}
              />
            ))}
            <button className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <span>View all music</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {activeTab === "videos" && (
          <motion.div key="videos" {...tabFade} className="space-y-3">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                isCommentsOpen={openCommentsId === video.id}
                onToggleComments={() => handleToggleComments(video.id)}
              />
            ))}
            <button className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <span>View all videos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {activeTab === "photos" && (
          <motion.div key="photos" {...tabFade} className="grid grid-cols-3 gap-2">
            {userPosts.map((post, index) => (
              <motion.div
                key={`photo-only-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                className="neo-card p-1 rounded-xl group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img src={post.image} alt="" className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Profile Photo Dialog */}
      <Dialog open={profilePhotoDialogOpen} onOpenChange={setProfilePhotoDialogOpen}>
        <DialogContent className="neo-card border-0 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Change Profile Photo</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Preview with zoom/drag */}
            <div className="relative">
              <div 
                className="neo-card p-1 animate-blob-morph overflow-hidden cursor-move" 
                style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="w-32 h-32 overflow-hidden animate-blob-morph"
                  style={{ borderRadius: '55% 45% 35% 65% / 55% 35% 65% 45%' }}
                >
                  <img
                    src={previewPhoto || profilePhoto}
                    alt="Preview"
                    className="w-full h-full object-cover select-none"
                    style={{ 
                      transform: `scale(${photoZoom}) translate(${photoPosition.x / photoZoom}px, ${photoPosition.y / photoZoom}px)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              {previewPhoto && (
                <button 
                  onClick={() => {
                    setPreviewPhoto(null);
                    setPhotoZoom(1);
                    setPhotoPosition({ x: 0, y: 0 });
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Zoom Slider */}
            {previewPhoto && (
              <div className="w-full flex items-center gap-3 px-2">
                <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[photoZoom]}
                  onValueChange={(value) => setPhotoZoom(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            )}

            {previewPhoto && (
              <p className="text-xs text-muted-foreground text-center">
                Drag to reposition • Use slider to zoom
              </p>
            )}

            {/* Upload Options */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="neo-button flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Image className="w-5 h-5" />
                <span>Gallery</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="neo-button flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Camera</span>
              </button>
            </div>

            {/* Action Buttons */}
            {previewPhoto && (
              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={handleCancelPhoto}
                  className="neo-button flex-1 py-2.5 rounded-xl text-muted-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePhoto}
                  className="action-button action-button-primary flex-1"
                >
                  Save Photo
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
