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
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!storyId || !stickerId) return;
    const { data } = await supabase
      .from("story_poll_votes")
      .select("user_id, option_index")
      .eq("story_id", storyId)
      .eq("sticker_id", stickerId);
    setVotes((data ?? []) as PollVote[]);
    setLoading(false);
  }, [storyId, stickerId]);

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

  const myVote = user ? votes.find((v) => v.user_id === user.id)?.option_index ?? null : null;

  const tally = (n: number) => {
    const counts = Array.from({ length: n }, () => 0);
    votes.forEach((v) => {
      if (v.option_index >= 0 && v.option_index < n) counts[v.option_index]++;
    });
    return counts;
  };

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
