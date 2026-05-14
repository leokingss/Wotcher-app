import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InboxItem {
  conversation_id: string;
  last_message_at: string;
  last_read_at: string;
  other: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  last_message: { body: string | null; media_type: string; sender_id: string; created_at: string } | null;
  unread: boolean;
  unread_count: number;
}

export const useInbox = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);

    // 1. my participations
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    const ids = (parts ?? []).map((p) => p.conversation_id);
    if (!ids.length) { setItems([]); setLoading(false); return; }

    // 2. conversations
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, last_message_at")
      .in("id", ids)
      .order("last_message_at", { ascending: false });

    // 3. other participants
    const { data: others } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profile:profiles!conversation_participants_user_id_fkey(id, username, display_name, avatar_url)")
      .in("conversation_id", ids)
      .neq("user_id", user.id);

    // 4. last messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, body, media_type, sender_id, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });

    const lastByConv = new Map<string, any>();
    (msgs ?? []).forEach((m) => { if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m); });

    const otherByConv = new Map<string, any>();
    (others ?? []).forEach((o: any) => { otherByConv.set(o.conversation_id, o.profile); });

    const readByConv = new Map<string, string>();
    (parts ?? []).forEach((p) => readByConv.set(p.conversation_id, p.last_read_at));

    const result: InboxItem[] = (convs ?? []).map((c) => {
      const lm = lastByConv.get(c.id);
      const lr = readByConv.get(c.id);
      return {
        conversation_id: c.id,
        last_message_at: c.last_message_at,
        last_read_at: lr ?? c.last_message_at,
        other: otherByConv.get(c.id) ?? null,
        last_message: lm ?? null,
        unread: !!lm && lm.sender_id !== user.id && new Date(lm.created_at) > new Date(lr ?? 0),
      };
    });
    setItems(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("inbox-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  return { items, loading, reload: load };
};

export const getOrCreateDM = async (otherUserId: string): Promise<string> => {
  const { data, error } = await supabase.rpc("get_or_create_dm", { _other: otherUserId });
  if (error) throw error;
  return data as string;
};

export const startDMByUsername = async (username: string): Promise<string | null> => {
  const { data: p } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!p) return null;
  return await getOrCreateDM(p.id);
};
