import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FeaturedSong, PlaylistItem, VideoItem } from "@/data/mockProfile";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop";
const FALLBACK_THUMB = "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop";

const formatDuration = (s: number | null) => {
  if (!s || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export interface UserMedia {
  featuredSongs: FeaturedSong[];
  playlist: PlaylistItem[];
  videos: VideoItem[];
  loading: boolean;
  refresh: () => void;
}

export const useUserMedia = (userId?: string | null, artistName?: string): UserMedia => {
  const [featuredSongs, setFeaturedSongs] = useState<FeaturedSong[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) {
      setFeaturedSongs([]);
      setPlaylist([]);
      setVideos([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: tracks }, { data: vids }] = await Promise.all([
        supabase
          .from("tracks")
          .select("id, title, audio_url, cover_url, duration_seconds, release_type, created_at")
          .eq("artist_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("videos")
          .select("id, title, video_url, thumbnail_url, duration_seconds, created_at")
          .eq("artist_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;

      const name = artistName ?? "Artist";
      const mappedPlaylist: PlaylistItem[] = (tracks ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        artist: name,
        duration: formatDuration(t.duration_seconds),
        cover: t.cover_url ?? FALLBACK_COVER,
        likes: 0,
        comments: 0,
      }));
      const mappedFeatured: FeaturedSong[] = (tracks ?? [])
        .slice(0, 2)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          artist: name,
          cover: t.cover_url ?? FALLBACK_COVER,
          audioUrl: t.audio_url,
        }));
      const mappedVideos: VideoItem[] = (vids ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        duration: formatDuration(v.duration_seconds),
        thumbnail: v.thumbnail_url ?? FALLBACK_THUMB,
        likes: 0,
        comments: 0,
        views: "0",
      }));

      setPlaylist(mappedPlaylist);
      setFeaturedSongs(mappedFeatured);
      setVideos(mappedVideos);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, artistName, tick]);

  return { featuredSongs, playlist, videos, loading, refresh: () => setTick((t) => t + 1) };
};
