import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const REACTION_EMOJIS = ["❤️", "🔥", "👏", "😂", "😮", "😢"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface ReactionRow {
  id: string;
  story_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  author?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Subscribes to reactions on a single story (frame). Owner mode (`asOwner`)
 * fetches every reaction to power the analytics inbox; viewer mode only
 * resolves the current user's own reaction (RLS keeps the rest hidden).
 *
 * Counts are derived locally so the live emoji bar updates as soon as the
 * realtime INSERT/UPDATE/DELETE arrives.
 */
export const useStoryReactions = (storyId?: string | null, asOwner = false) => {
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storyId) {
      setRows([]);
      setMyEmoji(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;

      const { data, error } = await supabase
        .from("story_reactions")
        .select("id, story_id, user_id, emoji, created_at")
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        setMyEmoji(null);
        setLoading(false);
        return;
      }

      let hydrated: ReactionRow[] = data;
      if (asOwner && data.length > 0) {
        const ids = Array.from(new Set(data.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids);
        const byId = Object.fromEntries(
          (profs ?? []).map((p) => [p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }]),
        );
        hydrated = data.map((r) => ({ ...r, author: byId[r.user_id] ?? null }));
      }

      setRows(hydrated);
      setMyEmoji(uid ? data.find((r) => r.user_id === uid)?.emoji ?? null : null);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`story-reactions-${storyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "story_reactions", filter: `story_id=eq.${storyId}` },
        async (payload) => {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth?.user?.id ?? null;
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as ReactionRow;
            setRows((prev) => prev.filter((r) => r.id !== oldRow.id));
            if (uid && oldRow.user_id === uid) setMyEmoji(null);
            return;
          }
          const row = payload.new as ReactionRow;
          let author: ReactionRow["author"] = null;
          if (asOwner) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url")
              .eq("id", row.user_id)
              .maybeSingle();
            author = prof
              ? { username: prof.username, display_name: prof.display_name, avatar_url: prof.avatar_url }
              : null;
          }
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === row.id);
            const next = { ...row, author } as ReactionRow;
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
          if (uid && row.user_id === uid) setMyEmoji(row.emoji);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [storyId, asOwner]);

  /** Toggle / swap reaction. Tapping the same emoji clears it. */
  const react = useCallback(
    async (emoji: string) => {
      if (!storyId) return;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      // Optimistic local state
      const prevEmoji = myEmoji;
      if (prevEmoji === emoji) {
        setMyEmoji(null);
        setRows((prev) => prev.filter((r) => !(r.user_id === uid)));
        await supabase.from("story_reactions").delete().eq("story_id", storyId).eq("user_id", uid);
        return;
      }
      setMyEmoji(emoji);
      setRows((prev) => {
        const without = prev.filter((r) => r.user_id !== uid);
        return [
          { id: `temp-${uid}`, story_id: storyId, user_id: uid, emoji, created_at: new Date().toISOString() },
          ...without,
        ];
      });
      await supabase
        .from("story_reactions")
        .upsert({ story_id: storyId, user_id: uid, emoji }, { onConflict: "story_id,user_id" });
    },
    [storyId, myEmoji],
  );

  return { rows, myEmoji, react, loading };
};

/** Aggregate per-emoji counts in display order. */
export const tallyReactions = (rows: ReactionRow[]) => {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
  return counts;
};
