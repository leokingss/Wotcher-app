export interface FeaturedSong {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
}

export const featuredSongs: FeaturedSong[] = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Wave",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
  },
  {
    id: 2,
    title: "Electric Sunrise",
    artist: "Neon Pulse",
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/forest_night.ogg",
  },
];

export interface PlaylistItem {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  likes: number;
  comments: number;
}

export const playlist: PlaylistItem[] = [
  { id: 1, title: "Midnight Dreams", artist: "Luna Wave", duration: "3:45", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop", likes: 48, comments: 12 },
  { id: 2, title: "Electric Sunrise", artist: "Neon Pulse", duration: "4:12", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop", likes: 125, comments: 34 },
  { id: 3, title: "Ocean Waves", artist: "Calm Beats", duration: "3:28", cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&h=100&fit=crop", likes: 89, comments: 21 },
  { id: 4, title: "City Lights", artist: "Urban Echo", duration: "4:02", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop", likes: 256, comments: 45 },
  { id: 5, title: "Summer Breeze", artist: "Chill Vibes", duration: "3:55", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop", likes: 178, comments: 28 },
];

export interface VideoItem {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: string;
}

export const videos: VideoItem[] = [
  { id: 101, title: "Mountain Hiking Adventure", duration: "2:34", thumbnail: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop", likes: 342, comments: 56, views: "12.4k" },
  { id: 102, title: "Sunset Timelapse Collection", duration: "1:48", thumbnail: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=300&fit=crop", likes: 589, comments: 87, views: "28.7k" },
];
