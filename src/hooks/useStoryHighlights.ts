import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Sticker } from "@/lib/stickers";
import type { StoryMediaType } from "./useStories";

export interface StoryHighlightItem {
  id: string;
  highlight_id: string;
  user_id: string;
  original_story_id: string | null;
  media_type: StoryMediaType;
  media_url: string;
  caption: string | null;
  track_title: string | null;
  track_artist: string | null;
  filter_id: string | null;
  filter_intensity: number;
  stickers: Sticker[];
  position: number;
  captured_at: string;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
  position: number;
  created_at: string;
  items: StoryHighlightItem[];
}

export const useStoryHighlights = (userId: string | undefined | null) => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setHighlights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: hs } = await supabase
      .from("story_highlights")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    const ids = (hs ?? []).map((h: any) => h.id);
    let items: any[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("story_highlight_items")
        .select("*")
        .in("highlight_id", ids)
        .order("position", { ascending: true });
      items = data ?? [];
    }
    const grouped: StoryHighlight[] = (hs ?? []).map((h: any) => ({
      ...h,
      items: items.filter((it) => it.highlight_id === h.id),
    }));
    setHighlights(grouped);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
    if (!userId) return;
    const ch = supabase
      .channel(`highlights-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "story_highlights", filter: `user_id=eq.${userId}` },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "story_highlight_items", filter: `user_id=eq.${userId}` },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll, userId]);

  const isOwner = !!user && !!userId && user.id === userId;

  const createHighlight = async (
    title: string,
    items: Array<{
      original_story_id?: string | null;
      media_type: StoryMediaType;
      media_url: string;
      caption?: string | null;
      track_title?: string | null;
      track_artist?: string | null;
      filter_id?: string | null;
      filter_intensity?: number;
      stickers?: Sticker[];
    }>,
  ) => {
    if (!user) throw new Error("not authenticated");
    const cover = items[0]?.media_url ?? null;
    const nextPos = highlights.length;
    const { data: h, error } = await supabase
      .from("story_highlights")
      .insert({ user_id: user.id, title, cover_url: cover, position: nextPos })
      .select()
      .single();
    if (error) throw error;
    if (items.length) {
      const rows = items.map((it, i) => ({
        highlight_id: h.id,
        user_id: user.id,
        original_story_id: it.original_story_id ?? null,
        media_type: it.media_type,
        media_url: it.media_url,
        caption: it.caption ?? null,
        track_title: it.track_title ?? null,
        track_artist: it.track_artist ?? null,
        filter_id: it.filter_id ?? null,
        filter_intensity: it.filter_intensity ?? 1,
        stickers: (it.stickers ?? []) as any,
        position: i,
      }));
      await supabase.from("story_highlight_items").insert(rows);
    }
    fetchAll();
    return h.id as string;
  };

  const renameHighlight = async (id: string, title: string) => {
    await supabase.from("story_highlights").update({ title }).eq("id", id);
  };

  const setHighlightCover = async (id: string, cover_url: string) => {
    await supabase.from("story_highlights").update({ cover_url }).eq("id", id);
  };

  const deleteHighlight = async (id: string) => {
    await supabase.from("story_highlights").delete().eq("id", id);
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("story_highlight_items").delete().eq("id", itemId);
  };

  const addItemsToHighlight = async (
    highlightId: string,
    items: Parameters<typeof createHighlight>[1],
  ) => {
    if (!user) throw new Error("not authenticated");
    const existing = highlights.find((h) => h.id === highlightId);
    const startPos = existing?.items.length ?? 0;
    const rows = items.map((it, i) => ({
      highlight_id: highlightId,
      user_id: user.id,
      original_story_id: it.original_story_id ?? null,
      media_type: it.media_type,
      media_url: it.media_url,
      caption: it.caption ?? null,
      track_title: it.track_title ?? null,
      track_artist: it.track_artist ?? null,
      filter_id: it.filter_id ?? null,
      filter_intensity: it.filter_intensity ?? 1,
      stickers: (it.stickers ?? []) as any,
      position: startPos + i,
    }));
    await supabase.from("story_highlight_items").insert(rows);
    fetchAll();
  };

  return {
    highlights,
    loading,
    isOwner,
    createHighlight,
    renameHighlight,
    setHighlightCover,
    deleteHighlight,
    removeItem,
    addItemsToHighlight,
    refresh: fetchAll,
  };
};
