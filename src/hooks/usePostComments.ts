import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  edited: boolean;
  created_at: string;
  profile: { username: string; avatar_url: string | null } | null;
}

const EDIT_WINDOW_MS = 60 * 60 * 1000;

export const usePostComments = (postId: string | null) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetch = useCallback(async () => {
    if (!postId) return;
    const { data } = await supabase
      .from("comments")
      .select("id, post_id, user_id, text, edited, created_at, profile:profiles!comments_user_id_fkey(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments((data ?? []) as any);
  }, [postId]);

  useEffect(() => {
    fetch();
    if (!postId) return;
    const ch = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [postId, fetch]);

  const addComment = async (text: string) => {
    if (!user || !postId) return;
    const t = text.trim();
    if (!t) return;
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, text: t });
  };

  const canEdit = (c: PostComment) =>
    !!user && c.user_id === user.id && Date.now() - new Date(c.created_at).getTime() < EDIT_WINDOW_MS;

  const startEdit = (c: PostComment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const saveEdit = async (id: string) => {
    const t = editText.trim();
    if (!t) return;
    await supabase.from("comments").update({ text: t, edited: true }).eq("id", id);
    setEditingId(null);
    setEditText("");
  };

  return { comments, addComment, editingId, editText, setEditText, canEdit, startEdit, cancelEdit, saveEdit };
};
