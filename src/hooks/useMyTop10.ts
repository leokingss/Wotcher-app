import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { PlaylistItem } from "@/data/mockProfile";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop";

const fmt = (s: number | null) => {
  if (!s || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Tracks the current viewer has saved to their personal Top 10,
 * ordered by `top10_rank` ascending. Realtime — re-runs whenever
 * track_saves changes for this user.
 */
export const useMyTop10 = (): { songs: PlaylistItem[]; loading: boolean } => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setSongs([]); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("track_saves")
        .select("top10_rank, tracks:track_id ( id, title, cover_url, duration_seconds, artist_id, profiles:artist_id ( username, display_name ) )")
        .eq("user_id", user.id)
        .not("top10_rank", "is", null)
        .order("top10_rank", { ascending: true });
      if (cancelled) return;
      const items: PlaylistItem[] = (data ?? [])
        .filter((r: any) => r.tracks)
        .map((r: any) => ({
          id: r.tracks.id,
          title: r.tracks.title,
          artist: r.tracks.profiles?.display_name ?? r.tracks.profiles?.username ?? "Artist",
          duration: fmt(r.tracks.duration_seconds),
          cover: r.tracks.cover_url ?? FALLBACK_COVER,
          likes: 0,
          comments: 0,
        }));
      setSongs(items);
      setLoading(false);
    };

    load();
    const channel = supabase
      .channel(`top10-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "track_saves", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  return { songs, loading };
};
