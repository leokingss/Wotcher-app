import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Save another artist's track to the viewer's personal Top 10.
 * Picks the next free rank (1..10). Re-toggling removes the save.
 *
 * `trackId` must be a real Supabase track UUID; if it isn't (e.g. mock
 * numeric id) the hook becomes a no-op so the UI can hide its button.
 */
export const useTop10Save = (trackId: string | number | null | undefined) => {
  const { user } = useAuth();
  const id = typeof trackId === "string" && trackId.length >= 32 ? trackId : null;
  const [saved, setSaved] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const enabled = !!user && !!id;

  useEffect(() => {
    if (!enabled) { setSaved(false); setRank(null); return; }
    let cancelled = false;
    supabase
      .from("track_saves")
      .select("top10_rank")
      .eq("user_id", user!.id)
      .eq("track_id", id!)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSaved(!!data);
        setRank(data?.top10_rank ?? null);
      });
    return () => { cancelled = true; };
  }, [enabled, user, id]);

  const toggle = useCallback(async (): Promise<{ ok: boolean; reason?: "full" | "auth" | "error"; rank?: number }> => {
    if (!user) return { ok: false, reason: "auth" };
    if (!id) return { ok: false, reason: "error" };
    setLoading(true);
    try {
      if (saved) {
        const { error } = await supabase
          .from("track_saves")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", id);
        if (error) throw error;
        setSaved(false);
        setRank(null);
        return { ok: true };
      }
      // find next available rank 1..10
      const { data: existing, error: readErr } = await supabase
        .from("track_saves")
        .select("top10_rank")
        .eq("user_id", user.id)
        .not("top10_rank", "is", null);
      if (readErr) throw readErr;
      const used = new Set((existing ?? []).map((r) => r.top10_rank as number));
      let nextRank: number | null = null;
      for (let i = 1; i <= 10; i++) if (!used.has(i)) { nextRank = i; break; }
      if (nextRank === null) return { ok: false, reason: "full" };
      const { error } = await supabase
        .from("track_saves")
        .insert({ user_id: user.id, track_id: id, top10_rank: nextRank });
      if (error) throw error;
      setSaved(true);
      setRank(nextRank);
      return { ok: true, rank: nextRank };
    } catch {
      return { ok: false, reason: "error" };
    } finally {
      setLoading(false);
    }
  }, [user, id, saved]);

  return { saved, rank, loading, toggle, available: enabled };
};
