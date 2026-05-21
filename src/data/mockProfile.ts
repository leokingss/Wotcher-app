export interface FeaturedSong {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
}

export interface PlaylistItem {
  id: string | number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  likes: number;
  comments: number;
}

export interface VideoItem {
  id: string | number;
  title: string;
  duration: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: string;
}

// Real data is loaded via the useUserMedia hook; these arrays remain for
// any legacy reference and are intentionally empty.
export const featuredSongs: FeaturedSong[] = [];
export const playlist: PlaylistItem[] = [];
export const videos: VideoItem[] = [];
