import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, Menu, Plus, Grid3X3, Music, Film, UserSquare2, Link as LinkIcon, Bookmark, ChevronRight, Camera, Image, X, ZoomIn, ZoomOut, ShoppingBag, QrCode } from "lucide-react";
import ProfileQRDialog from "@/components/ProfileQRDialog";
import BottomNav from "@/components/BottomNav";
import SongCard from "@/components/SongCard";
import MusicFilterChips, { MusicFilter } from "@/components/MusicFilterChips";
import Top10List from "@/components/Top10List";
import FeaturedSongRow from "@/components/FeaturedSongRow";
import VideoCard from "@/components/VideoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import EmptyState from "@/components/EmptyState";
import PostContextMenu from "@/components/PostContextMenu";
import FollowSheet from "@/components/FollowSheet";
import Highlights from "@/components/Highlights";
import { usePlayer } from "@/hooks/usePlayer";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import FriendCircleMenu from "@/components/FriendCircleMenu";
import { useSellerListings } from "@/hooks/useListings";
import ListingDialog from "@/components/ListingDialog";
import TimeLeft from "@/components/TimeLeft";
import { Gavel, Tag } from "lucide-react";
import SellerRating from "@/components/SellerRating";
import ShippingAddressDialog from "@/components/ShippingAddressDialog";

const tabFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
};

import { featuredSongs, playlist, videos } from "@/data/mockProfile";


const Profile = () => {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const { username: routeUsername } = useParams<{ username?: string }>();
  const [searchParams] = useSearchParams();

  // Viewed profile (may differ from signed-in user)
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [viewedLoading, setViewedLoading] = useState(!!routeUsername);

  useEffect(() => {
    if (!routeUsername) { setViewedProfile(null); return; }
    setViewedLoading(true);
    supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, account_type")
      .eq("username", routeUsername)
      .maybeSingle()
      .then(({ data }) => {
        setViewedProfile(data);
        setViewedLoading(false);
      });
  }, [routeUsername]);

  const profile = routeUsername ? viewedProfile : myProfile;
  const profileUserId = routeUsername ? viewedProfile?.id : user?.id;
  const isOwnProfile = !routeUsername || (user && viewedProfile && user.id === viewedProfile.id);

  const { posts: cloudPosts } = usePosts(profileUserId);
  const userPosts = cloudPosts.map((p) => ({ image: p.image_url }));
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!profileUserId) return;
    (async () => {
      const [{ count: f1 }, { count: f2 }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileUserId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileUserId),
      ]);
      setFollowers(f1 ?? 0);
      setFollowing(f2 ?? 0);
      if (user && !isOwnProfile) {
        const { data } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profileUserId)
          .maybeSingle();
        setIsFollowing(!!data);
      }
    })();
  }, [profileUserId, user, isOwnProfile]);

  const handleFollow = async (circle: string) => {
    if (!profileUserId) return;
    // Re-verify the live session — the cached `user` from context can go stale.
    const { data: sessionData } = await supabase.auth.getSession();
    const liveUserId = sessionData.session?.user?.id;
    if (!liveUserId) {
      toast.error("Your session expired. Please sign in again.");
      return;
    }
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete().eq("follower_id", liveUserId).eq("following_id", profileUserId);
      if (error) { toast.error(error.message); return; }
      setIsFollowing(false);
      setFollowers((c) => Math.max(0, c - 1));
      toast.success("Unfollowed");
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: liveUserId, following_id: profileUserId });
      if (error) { toast.error(error.message); return; }
      setIsFollowing(true);
      setFollowers((c) => c + 1);
      toast.success(`Added to ${circle}`);
    }
  };

  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    const lid = searchParams.get("listing");
    if (lid) {
      setActiveTab("shop");
      setOpenListingId(lid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("listing")]);
  const [musicFilter, setMusicFilter] = useState<MusicFilter>("top10");
  const isArtist = profile?.account_type === "artist";
  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const [followSheet, setFollowSheet] = useState<"followers" | "following" | null>(null);
  const [profilePhotoDialogOpen, setProfilePhotoDialogOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(profile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop");
  const { listings: shopListings } = useSellerListings(profileUserId);
  const [openListingId, setOpenListingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.avatar_url) setProfilePhoto(profile.avatar_url);
  }, [profile?.avatar_url]);
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
      img.onload = async () => {
        if (!ctx) return;
        const scaledSize = size * photoZoom;
        const offsetX = (size - scaledSize) / 2 + (photoPosition.x / 64) * (scaledSize / 2);
        const offsetY = (size - scaledSize) / 2 + (photoPosition.y / 64) * (scaledSize / 2);
        ctx.drawImage(img, offsetX, offsetY, scaledSize, scaledSize);
        setProfilePhoto(canvas.toDataURL('image/jpeg', 0.9));
        setPreviewPhoto(null);
        setPhotoZoom(1);
        setPhotoPosition({ x: 0, y: 0 });
        setProfilePhotoDialogOpen(false);
        // Upload to storage
        if (user) {
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const path = `${user.id}/avatar-${Date.now()}.jpg`;
            const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
            if (upErr) { toast.error(upErr.message); return; }
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
            await refreshProfile();
            toast.success('Profile photo updated');
          }, 'image/jpeg', 0.9);
        }
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

  if (routeUsername && viewedLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading profile…</div>;
  }
  if (routeUsername && !viewedProfile) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button className="neo-button-icon w-10 h-10 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
          <button className="neo-button px-4 py-2 rounded-full flex items-center gap-1.5">
            <span className="font-semibold text-sm">{profile?.username ?? 'you'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => setQrOpen(true)} aria-label="Show profile QR code" className="neo-button-icon w-10 h-10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {/* Profile Stats - hero with grain texture */}
        <div className="grain-overlay rounded-3xl">
        <div className="flex items-center justify-center gap-8 py-6">
          <button onClick={() => setFollowSheet("followers")} className="text-center group">
            <p className="neo-button px-3 py-1.5 rounded-xl font-bold text-lg mb-1 group-hover:text-primary transition-colors">{followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-md animate-blob-morph" 
                 style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', transform: 'scale(1.1)' }} />
            {player.track && (
              <span
                aria-hidden
                className="absolute -inset-1 rounded-full pointer-events-none animate-spin"
                style={{
                  background: "conic-gradient(from 0deg, hsl(var(--primary)), transparent 55%, hsl(var(--primary)))",
                  animationDuration: "4s",
                  borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                  WebkitMask: 'radial-gradient(circle, transparent 60%, #000 62%)',
                  mask: 'radial-gradient(circle, transparent 60%, #000 62%)',
                }}
              />
            )}
            <div className="neo-card p-1 relative animate-blob-morph" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}>
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-[102px] h-[102px] object-cover animate-blob-morph"
                style={{ borderRadius: '55% 45% 35% 65% / 55% 35% 65% 45%' }}
              />
            </div>
            {player.track && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 neo-card px-2 py-0.5 rounded-full flex items-center gap-1 z-10 whitespace-nowrap">
                <Music className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium truncate max-w-[120px]">{player.track.title}</span>
              </div>
            )}
            {isOwnProfile && (
              <button
                onClick={() => setProfilePhotoDialogOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg z-10"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button onClick={() => setFollowSheet("following")} className="text-center group">
            <p className="neo-button px-3 py-1.5 rounded-xl font-bold text-lg mb-1 group-hover:text-primary transition-colors">{following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </button>
        </div>

        {/* Stats chips row */}
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="neo-card-inset px-3 py-1 rounded-full text-[11px] font-medium text-muted-foreground">
            <span className="text-foreground font-semibold">{userPosts.length + playlist.length + videos.length}</span> posts
          </span>
          <span className="neo-card-inset px-3 py-1 rounded-full text-[11px] font-medium text-muted-foreground">
            <span className="text-foreground font-semibold">{playlist.length}</span> tracks
          </span>
          <span className="neo-card-inset px-3 py-1 rounded-full text-[11px] font-medium text-muted-foreground">
            <span className="text-foreground font-semibold">{videos.length}</span> videos
          </span>
        </div>

        {/* Bio */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-lg">
            <span className="text-signature">{profile?.display_name ?? profile?.username ?? 'You'}</span>
          </h2>
          {profile?.bio && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{profile.bio}</p>}
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          {isOwnProfile ? (
            <>
              <button className="neo-button px-5 py-2 rounded-full text-sm font-medium">Edit profile</button>
              <button className="neo-button px-5 py-2 rounded-full text-sm font-medium">Statistics</button>
              <button className="action-button action-button-primary">Contact</button>
            </>
          ) : (
            <>
              {isFollowing ? (
                <button onClick={() => handleFollow("")} className="neo-button px-5 py-2 rounded-full text-sm font-medium">
                  Following
                </button>
              ) : (
                <FriendCircleMenu
                  username={profile?.username ?? ""}
                  onSelect={(c) => handleFollow(String(c))}
                  variant="pill"
                />
              )}
              <button className="neo-button px-5 py-2 rounded-full text-sm font-medium">Message</button>
              <button className="neo-button-icon w-10 h-10 flex items-center justify-center rounded-full">
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
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

        {/* Highlights row */}
        <Highlights />

        {/* Tabs - icon buttons with sliding active indicator */}
        <div className="flex justify-between mb-4">
          {[
            { id: "posts", Icon: Grid3X3 },
            { id: "music", Icon: Music },
            { id: "videos", Icon: Film },
            { id: "photos", Icon: UserSquare2 },
            { id: "links", Icon: LinkIcon },
            { id: "shop", Icon: ShoppingBag },
            { id: "saved", Icon: Bookmark },
          ].map(({ id, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
                  isActive ? "text-primary" : "neo-button-icon text-muted-foreground"
                }`}
                aria-pressed={isActive}
              >
                {isActive && (
                  <motion.span
                    layoutId="profile-tab-indicator"
                    className="absolute inset-0 rounded-full neo-card-inset"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
              </button>
            );
          })}
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
            <MusicFilterChips
              active={musicFilter}
              onChange={setMusicFilter}
              isOwnProfile={isOwnProfile}
            />
            {musicFilter === "top10" ? (
              <Top10List
                songs={playlist}
                openCommentsId={openCommentsId}
                onToggleComments={handleToggleComments}
                isOwnProfile={isOwnProfile}
              />
            ) : (() => {
              // Mock filtering until backend tags songs by type/saved state
              const filtered =
                musicFilter === "featured"
                  ? playlist.slice(0, Math.min(3, playlist.length))
                  : musicFilter === "releases"
                  ? playlist
                  : musicFilter === "singles"
                  ? playlist.slice(0, Math.ceil(playlist.length / 2))
                  : []; // saved (own profile only)

              const emptyCopy = {
                featured: { title: "No featured tracks", desc: "Pin your best work to highlight it here." },
                releases: { title: "No releases yet", desc: isArtist ? "Upload your first track to get started." : "This artist hasn't released anything yet." },
                singles: { title: "No singles yet", desc: "Singles you release will appear here." },
                saved: { title: "Nothing saved yet", desc: "Tap bookmark on any song to save it to your library." },
                top10: { title: "Build your Top 10", desc: "Curate your 10 favorite tracks of all time." },
              }[musicFilter];

              if (filtered.length === 0) {
                return <EmptyState icon={musicFilter === "saved" ? Bookmark : Music} title={emptyCopy.title} description={emptyCopy.desc} />;
              }

              return (
                <>
                  {filtered.map((song) => (
                    <SongCard
                      key={song.id}
                      {...song}
                      isCommentsOpen={openCommentsId === song.id}
                      onToggleComments={() => handleToggleComments(song.id)}
                    />
                  ))}
                  <button className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
                    <span>View all {musicFilter}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              );
            })()}
          </motion.div>
        )}

        {activeTab === "videos" && (
          <motion.div key="videos" {...tabFade} className="space-y-3">
            {videos.length === 0 ? (
              <EmptyState icon={Film} title="No videos yet" description="Share your first clip to get the reel rolling." />
            ) : (
              <>
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
              </>
            )}
          </motion.div>
        )}

        {activeTab === "photos" && (
          <motion.div key="photos" {...tabFade}>
            {userPosts.length === 0 ? (
              <EmptyState icon={UserSquare2} title="No photos yet" description="Photos you post will live here." />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {userPosts.map((post, index) => (
                  <PostContextMenu key={`photo-only-${index}`} label="Photo">
                    <motion.div
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
                  </PostContextMenu>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "links" && (
          <motion.div key="links" {...tabFade}>
            <EmptyState
              icon={LinkIcon}
              title="No links yet"
              description="Add links to your portfolio, socials, or anywhere else you want people to find you."
              action={
                <button className="action-button action-button-primary text-sm">
                  Add a link
                </button>
              }
            />
          </motion.div>
        )}

        {activeTab === "shop" && (
          <motion.div key="shop" {...tabFade}>
            {profileUserId && (
              <div className="neo-card-inset rounded-2xl p-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Seller rating</span>
                  <SellerRating sellerId={profileUserId} compact />
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setAddressOpen(true)}
                    className="text-xs font-semibold text-primary"
                  >
                    Address book
                  </button>
                )}
              </div>
            )}
            {shopListings.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={isOwnProfile ? "Nothing for sale yet" : "No items for sale"}
                description={isOwnProfile ? "When you upload a photo, toggle 'List for sale' to add it here." : "This user hasn't listed anything yet."}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {shopListings.map((l) => {
                  const isAuction = l.type === "auction";
                  const ended = l.ends_at ? new Date(l.ends_at).getTime() <= Date.now() : false;
                  const sold = l.status === "sold";
                  const display = isAuction ? (l.current_bid ?? l.starting_bid) : l.price;
                  const fmt = (n?: number | null) => n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
                  return (
                    <button
                      key={l.id}
                      onClick={() => setOpenListingId(l.id)}
                      className="group relative neo-card p-1.5 rounded-2xl text-left overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
                    >
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                        {l.image_url ? (
                          <img
                            src={l.image_url}
                            alt={l.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {isAuction ? <Gavel className="w-8 h-8 text-muted-foreground" /> : <Tag className="w-8 h-8 text-muted-foreground" />}
                          </div>
                        )}

                        {/* gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        {/* top chip: type + status */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md ${
                            sold ? "bg-foreground/80 text-background" :
                            isAuction ? "bg-primary/90 text-primary-foreground" :
                            "bg-background/80 text-foreground"
                          }`}>
                            {isAuction ? <Gavel className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                            {sold ? "SOLD" : isAuction ? "AUCTION" : "BUY NOW"}
                          </span>
                          {isAuction && l.ends_at && !sold && !ended && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md tabular-nums">
                              <TimeLeft endsAt={l.ends_at} compact />
                            </span>
                          )}
                          {(ended && !sold) && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md">ENDED</span>
                          )}
                        </div>

                        {/* bottom: title + price */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="text-xs font-medium truncate opacity-90">{l.title}</p>
                          <div className="flex items-end justify-between gap-2 mt-0.5">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider opacity-70">
                                {sold ? "Sold for" : isAuction ? (l.current_bid ? "Current bid" : "Starting at") : "Price"}
                              </p>
                              <p className="text-lg font-bold tabular-nums leading-tight">{fmt(display)}</p>
                            </div>
                            <span className="neo-button-icon !bg-primary/95 !shadow-none w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <ListingDialog open={!!openListingId} onOpenChange={(o) => !o && setOpenListingId(null)} listingId={openListingId} />
          </motion.div>
        )}

        {activeTab === "saved" && (
          <motion.div key="saved" {...tabFade}>
            <EmptyState
              icon={Bookmark}
              title="Nothing saved"
              description="Tap the bookmark icon on any post to save it here for later."
            />
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

      <FollowSheet open={followSheet !== null} onOpenChange={(o) => !o && setFollowSheet(null)} type={followSheet} userId={profileUserId} />
      <ProfileQRDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        username={profile?.username ?? "you"}
        displayName={profile?.display_name ?? undefined}
        avatarUrl={profilePhoto}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
