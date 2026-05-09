import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  media_type: "text" | "voice" | "image" | "video";
  duration_seconds: number | null;
  created_at: string;
}

export const useConversation = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [other, setOther] = useState<{ id: string; username: string; display_name: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((msgs ?? []) as any);
    seenIds.current = new Set((msgs ?? []).map((m: any) => m.id));

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("user_id, profile:profiles!conversation_participants_user_id_fkey(id, username, display_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id);
    setOther(((parts ?? [])[0] as any)?.profile ?? null);

    // mark read
    await supabase.from("conversation_participants").update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId).eq("user_id", user.id);

    setLoading(false);
  }, [conversationId, user]);

  useEffect(() => {
    load();
    if (!conversationId) return;
    const ch = supabase
      .channel(`dm-${conversationId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as DMMessage;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, m]);
          if (user && m.sender_id !== user.id) {
            supabase.from("conversation_participants")
              .update({ last_read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId).eq("user_id", user.id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, user, load]);

  const sendText = async (body: string) => {
    if (!conversationId || !user || !body.trim()) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: user.id,
      body: body.trim(), media_type: "text",
    });
  };

  const sendMedia = async (file: File, type: "voice" | "image" | "video", durationSec?: number) => {
    if (!conversationId || !user) return;
    const ext = file.name.split(".").pop() || (type === "voice" ? "webm" : type === "image" ? "jpg" : "mp4");
    const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("dm-media").upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;
    const { data: signed } = await supabase.storage.from("dm-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: user.id,
      media_url: signed?.signedUrl ?? null,
      media_type: type,
      duration_seconds: durationSec ?? null,
    });
  };

  return { messages, other, loading, sendText, sendMedia };
};
