import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FeaturedSong } from "@/data/mockProfile";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop";

/**
 * Top saved tracks (by top10_rank) for any profile user — used to render
 * "featured" songs on non-artist profiles. Default limit = 2.
 */
export const useUserTopSaves = (userId?: string | null, limit = 2): FeaturedSong[] => {
  const [songs, setSongs] = useState<FeaturedSong[]>([]);

  useEffect(() => {
    if (!userId) { setSongs([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("track_saves")
        .select("top10_rank, tracks:track_id ( id, title, audio_url, cover_url, artist_id, profiles:artist_id ( username, display_name ) )")
        .eq("user_id", userId)
        .not("top10_rank", "is", null)
        .order("top10_rank", { ascending: true })
        .limit(limit);
      if (cancelled) return;
      const items: FeaturedSong[] = (data ?? [])
        .filter((r: any) => r.tracks)
        .map((r: any) => ({
          id: r.tracks.id,
          title: r.tracks.title,
          artist: r.tracks.profiles?.display_name ?? r.tracks.profiles?.username ?? "Artist",
          cover: r.tracks.cover_url ?? FALLBACK_COVER,
          audioUrl: r.tracks.audio_url,
        }));
      setSongs(items);
    })();
    return () => { cancelled = true; };
  }, [userId, limit]);

  return songs;
};
