import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type FriendCircleEnum = "private" | "family" | "friends" | "groups";

interface CircleRow {
  member_id: string;
  circle: FriendCircleEnum;
}

let cache: Record<string, FriendCircleEnum> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/**
 * Single source of truth for the signed-in user's friend-circle assignments.
 * Reads `circle_members` once (per session) and pushes realtime updates so
 * every <FriendCircleMenu /> instance stays in sync after a write.
 */
export const useFriendCircles = () => {
  const { user } = useAuth();
  const [, force] = useState(0);
  const [loading, setLoading] = useState(cache === null);

  const refresh = useCallback(async () => {
    if (!user) {
      cache = {};
      notify();
      return;
    }
    const { data } = await supabase
      .from("circle_members")
      .select("member_id, circle")
      .eq("owner_id", user.id);
    const next: Record<string, FriendCircleEnum> = {};
    for (const row of (data ?? []) as CircleRow[]) {
      next[row.member_id] = row.circle;
    }
    cache = next;
    setLoading(false);
    notify();
  }, [user]);

  useEffect(() => {
    const sub = () => force((n) => n + 1);
    listeners.add(sub);
    if (cache === null) refresh();
    else setLoading(false);
    return () => {
      listeners.delete(sub);
    };
  }, [refresh]);

  // Reset cache when the auth user changes
  useEffect(() => {
    if (!user) {
      cache = {};
      notify();
      return;
    }
    refresh();
    const ch = supabase
      .channel(`circles-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circle_members", filter: `owner_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, refresh]);

  const getCircle = (memberId: string | undefined | null): FriendCircleEnum | null => {
    if (!memberId || !cache) return null;
    return cache[memberId] ?? null;
  };

  const setCircle = async (memberId: string, circle: FriendCircleEnum) => {
    if (!user) return { error: new Error("Not signed in") };
    // Optimistic local update
    cache = { ...(cache ?? {}), [memberId]: circle };
    notify();
    // Replace any existing row for this (owner, member)
    await supabase
      .from("circle_members")
      .delete()
      .eq("owner_id", user.id)
      .eq("member_id", memberId);
    const { error } = await supabase
      .from("circle_members")
      .insert({ owner_id: user.id, member_id: memberId, circle });
    if (error) {
      // Re-sync from server on failure
      refresh();
      return { error };
    }
    return { error: null };
  };

  const clearCircle = async (memberId: string) => {
    if (!user) return;
    if (cache) {
      const next = { ...cache };
      delete next[memberId];
      cache = next;
      notify();
    }
    await supabase
      .from("circle_members")
      .delete()
      .eq("owner_id", user.id)
      .eq("member_id", memberId);
  };

  return { loading, getCircle, setCircle, clearCircle, refresh };
};
