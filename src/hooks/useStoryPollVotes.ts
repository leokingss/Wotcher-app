import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PollVote {
  user_id: string;
  option_index: number;
}

/**
 * Realtime poll vote tally for a single (story_id, sticker_id).
 *
 * Returns counts per option, the signed-in user's current pick (or null), and
 * a `vote(idx)` mutator that upserts the user's vote and lets RLS handle
 * authorisation. Updates stream in via Postgres changes on
 * `story_poll_votes`.
 */
export const useStoryPollVotes = (storyId: string | undefined, stickerId: string | undefined) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<number[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!storyId || !stickerId) return;
    const [{ data: tallyRows }, mine] = await Promise.all([
      supabase.rpc("story_poll_tally", { _story_id: storyId, _sticker_id: stickerId }),
      user
        ? supabase
            .from("story_poll_votes")
            .select("option_index")
            .eq("story_id", storyId)
            .eq("sticker_id", stickerId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    const next: number[] = [];
    ((tallyRows ?? []) as any[]).forEach((r) => {
      next[r.option_index] = Number(r.votes);
    });
    setCounts(next);
    setMyVote((mine as any)?.data?.option_index ?? null);
    setLoading(false);
  }, [storyId, stickerId, user]);

  useEffect(() => {
    if (!storyId || !stickerId) return;
    fetchVotes();
    const ch = supabase
      .channel(`poll-${storyId}-${stickerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_poll_votes",
          filter: `sticker_id=eq.${stickerId}`,
        },
        () => fetchVotes(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [storyId, stickerId, fetchVotes]);

  const tally = (n: number) => Array.from({ length: n }, (_, i) => counts[i] ?? 0);


  const vote = async (optionIndex: number) => {
    if (!user || !storyId || !stickerId) return;
    // Optimistic update
    setVotes((prev) => {
      const without = prev.filter((v) => v.user_id !== user.id);
      return [...without, { user_id: user.id, option_index: optionIndex }];
    });
    await supabase
      .from("story_poll_votes")
      .upsert(
        { story_id: storyId, sticker_id: stickerId, user_id: user.id, option_index: optionIndex },
        { onConflict: "story_id,sticker_id,user_id" },
      );
  };

  return { votes, tally, myVote, vote, loading };
};
