import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TargetComment {
  id: string;
  post_id: string | null;
  track_id: string | null;
  video_id: string | null;
  user_id: string;
  text: string;
  edited: boolean;
  created_at: string;
  voice_url: string | null;
  voice_duration_seconds: number | null;
  profile: { username: string; avatar_url: string | null } | null;
}

export interface CommentTarget {
  postId?: string | null;
  trackId?: string | null;
  videoId?: string | null;
}

const EDIT_WINDOW_MS = 60 * 60 * 1000;

const resolveTarget = (t: CommentTarget) => {
  if (t.postId) return { col: "post_id" as const, id: t.postId };
  if (t.trackId) return { col: "track_id" as const, id: t.trackId };
  if (t.videoId) return { col: "video_id" as const, id: t.videoId };
  return null;
};

export const useTargetComments = (target: CommentTarget) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TargetComment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const resolved = resolveTarget(target);
  const col = resolved?.col;
  const id = resolved?.id;

  const fetchAll = useCallback(async () => {
    if (!col || !id) return;
    const { data } = await supabase
      .from("comments")
      .select(
        "id, post_id, track_id, video_id, user_id, text, edited, created_at, voice_url, voice_duration_seconds, profile:profiles!comments_user_id_fkey(username, avatar_url)"
      )
      .eq(col, id)
      .order("created_at", { ascending: false });
    setComments((data ?? []) as any);
  }, [col, id]);

  useEffect(() => {
    fetchAll();
    if (!col || !id) return;
    const ch = supabase
      .channel(`comments:${col}:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `${col}=eq.${id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [col, id, fetchAll]);

  const addComment = async (text: string) => {
    if (!user || !col || !id) return;
    const t = text.trim();
    if (!t) return;
    await supabase.from("comments").insert({ [col]: id, user_id: user.id, text: t });
  };

  const addVoiceComment = async (blob: Blob, durationSec: number) => {
    if (!user || !col || !id) return;
    const path = `${user.id}/${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage
      .from("voice-notes")
      .upload(path, blob, { contentType: blob.type || "audio/webm" });
    if (upErr) return;
    const { data: pub } = supabase.storage.from("voice-notes").getPublicUrl(path);
    await supabase.from("comments").insert({
      [col]: id,
      user_id: user.id,
      text: "🎤 voice note",
      voice_url: pub.publicUrl,
      voice_duration_seconds: durationSec,
    });
  };

  const canEdit = (c: TargetComment) =>
    !!user && c.user_id === user.id && !c.voice_url && Date.now() - new Date(c.created_at).getTime() < EDIT_WINDOW_MS;

  const startEdit = (c: TargetComment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const saveEdit = async (cid: string) => {
    const t = editText.trim();
    if (!t) return;
    await supabase.from("comments").update({ text: t, edited: true }).eq("id", cid);
    setEditingId(null);
    setEditText("");
  };

  return {
    comments,
    count: comments.length,
    addComment,
    addVoiceComment,
    editingId,
    editText,
    setEditText,
    canEdit,
    startEdit,
    cancelEdit,
    saveEdit,
  };
};
