import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Unread message count from a specific other user (their DM with me). */
export const useUnreadFromUser = (otherUserId: string | null | undefined) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!user || !otherUserId || otherUserId === user.id) { setCount(0); return; }

    // Find DM conversation shared with the other user.
    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    const ids = (mine ?? []).map((p) => p.conversation_id);
    if (!ids.length) { setCount(0); return; }

    const { data: theirs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", ids);

    const cid = theirs?.[0]?.conversation_id;
    if (!cid) { setCount(0); return; }

    const lastRead = mine?.find((p) => p.conversation_id === cid)?.last_read_at ?? new Date(0).toISOString();

    const { count: c } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", cid)
      .eq("sender_id", otherUserId)
      .gt("created_at", lastRead);

    setCount(c ?? 0);
  }, [user, otherUserId]);

  useEffect(() => {
    load();
    if (!user || !otherUserId) return;
    const ch = supabase
      .channel(`unread-from-${otherUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_participants", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, otherUserId, load]);

  return count;
};
