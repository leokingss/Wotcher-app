import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoryViewer {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Subscribe to story_views for a set of story (frame) ids belonging to the
 * current user. Returns viewers grouped by story_id and live-updates via
 * Supabase Realtime when new views are inserted.
 */
export const useStoryViewers = (frameIds: string[], enabled: boolean) => {
  const [viewers, setViewers] = useState<Record<string, StoryViewer[]>>({});
  const [loading, setLoading] = useState(false);

  // Stable key for effect deps
  const key = frameIds.slice().sort().join(",");

  useEffect(() => {
    if (!enabled || frameIds.length === 0) {
      setViewers({});
      return;
    }
    let cancelled = false;
    setLoading(true);

    const fetchViewers = async () => {
      const { data, error } = await supabase
        .from("story_views")
        .select(
          "story_id, viewer_id, viewed_at, profile:profiles!story_views_viewer_id_fkey(username, display_name, avatar_url)"
        )
        .in("story_id", frameIds)
        .order("viewed_at", { ascending: false });
      if (cancelled || error) return;
      const grouped: Record<string, StoryViewer[]> = {};
      for (const row of (data ?? []) as any[]) {
        const v: StoryViewer = {
          story_id: row.story_id,
          viewer_id: row.viewer_id,
          viewed_at: row.viewed_at,
          username: row.profile?.username ?? null,
          display_name: row.profile?.display_name ?? null,
          avatar_url: row.profile?.avatar_url ?? null,
        };
        (grouped[v.story_id] ||= []).push(v);
      }
      setViewers(grouped);
      setLoading(false);
    };

    fetchViewers();

    const ch = supabase
      .channel(`story-views-${key.slice(0, 32)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "story_views" },
        async (payload) => {
          const row: any = payload.new;
          if (!frameIds.includes(row.story_id)) return;
          // Fetch viewer profile to enrich
          const { data: prof } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", row.viewer_id)
            .maybeSingle();
          const v: StoryViewer = {
            story_id: row.story_id,
            viewer_id: row.viewer_id,
            viewed_at: row.viewed_at,
            username: prof?.username ?? null,
            display_name: prof?.display_name ?? null,
            avatar_url: prof?.avatar_url ?? null,
          };
          setViewers((prev) => {
            const list = prev[v.story_id] ?? [];
            if (list.some((x) => x.viewer_id === v.viewer_id)) return prev;
            return { ...prev, [v.story_id]: [v, ...list] };
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { viewers, loading };
};
