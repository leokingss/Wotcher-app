import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuestionReply {
  id: string;
  story_id: string;
  sticker_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Owner-side hook: subscribes to all replies on a given story (across stickers)
 * with realtime updates. The component then groups by `sticker_id` for display.
 */
export const useStoryQuestionReplies = (storyId?: string | null, enabled = true) => {
  const [replies, setReplies] = useState<QuestionReply[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storyId || !enabled) {
      setReplies([]);
      return;
    }
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("story_question_replies")
        .select("id, story_id, sticker_id, user_id, text, created_at")
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error || !data) {
        setReplies([]);
        setLoading(false);
        return;
      }
      // Hydrate authors in a single roundtrip.
      const ids = Array.from(new Set(data.map((r) => r.user_id)));
      let profilesById: Record<string, QuestionReply["author"]> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids);
        profilesById = Object.fromEntries(
          (profs ?? []).map((p) => [p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }]),
        );
      }
      setReplies(data.map((r) => ({ ...r, author: profilesById[r.user_id] ?? null })));
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`story-replies-${storyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "story_question_replies", filter: `story_id=eq.${storyId}` },
        async (payload) => {
          const row = payload.new as QuestionReply;
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", row.user_id)
            .maybeSingle();
          setReplies((prev) =>
            prev.some((r) => r.id === row.id)
              ? prev
              : [{ ...row, author: prof ? { username: prof.username, display_name: prof.display_name, avatar_url: prof.avatar_url } : null }, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [storyId, enabled]);

  return { replies, loading };
};

/** Viewer-side helper to send a reply. */
export const sendQuestionReply = async (
  storyId: string,
  stickerId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: "Sign in to reply" };
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return { ok: false, error: "Reply is empty" };
  const { error } = await supabase
    .from("story_question_replies")
    .insert({ story_id: storyId, sticker_id: stickerId, user_id: userId, text: trimmed });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

/** Group replies by sticker_id for the inbox view. */
export const groupRepliesBySticker = (replies: QuestionReply[]) => {
  const map: Record<string, QuestionReply[]> = {};
  for (const r of replies) {
    (map[r.sticker_id] ||= []).push(r);
  }
  return map;
};
