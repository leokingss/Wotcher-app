export interface Comment {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
  createdAt?: number;
  edited?: boolean;
}

export interface RichComment extends Comment {
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
}

export const EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const CURRENT_USER = "you";
export const CURRENT_USER_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop";

export const mockPostComments: RichComment[] = [
  {
    id: 1,
    username: "sarah_designs",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop",
    text: "This is absolutely stunning! 🔥",
    time: "2h",
    likes: 12,
    dislikes: 0,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: 2,
    username: "mike_photos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    text: "Love the composition here",
    time: "1h",
    likes: 8,
    dislikes: 1,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: 3,
    username: "creative_jane",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
    text: "Where was this taken?",
    time: "45m",
    likes: 3,
    dislikes: 0,
    isLiked: false,
    isDisliked: false,
  },
];

export const mockSongComments: Comment[] = [
  { id: 1, username: "musiclover", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop", text: "This track is amazing! 🔥", time: "2h" },
  { id: 2, username: "beatmaker", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop", text: "Love the vibe on this one", time: "5h" },
  { id: 3, username: "djsoul", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop", text: "Added to my playlist!", time: "1d" },
];

export const mockVideoComments: Comment[] = [
  { id: 1, username: "videostar", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop", text: "Great content! 🎬", time: "1h" },
  { id: 2, username: "filmmaker", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop", text: "Love the editing on this", time: "3h" },
  { id: 3, username: "creator_hub", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop", text: "Keep up the good work!", time: "1d" },
];
