import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FeedPost {
  id: string;
  user_id: string;
  caption: string | null;
  location: string | null;
  image_url: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  my_reaction: "like" | "dislike" | null;
}

export const usePosts = (filterUserId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    let q = supabase
      .from("posts")
      .select("id, user_id, caption, location, image_url, created_at, profile:profiles!posts_user_id_fkey(username, display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filterUserId) q = q.eq("user_id", filterUserId);
    const { data: postRows } = await q;
    if (!postRows) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const ids = postRows.map((p) => p.id);
    const [reactions, comments, mine] = await Promise.all([
      supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids),
      supabase.from("comments").select("post_id").in("post_id", ids),
      user
        ? supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids).eq("user_id", user.id)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const likeMap = new Map<string, number>();
    const dislikeMap = new Map<string, number>();
    (reactions.data ?? []).forEach((r: any) => {
      const m = r.reaction === "like" ? likeMap : dislikeMap;
      m.set(r.post_id, (m.get(r.post_id) ?? 0) + 1);
    });
    const commentMap = new Map<string, number>();
    (comments.data ?? []).forEach((c: any) => commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1));
    const myMap = new Map<string, "like" | "dislike">();
    (mine.data ?? []).forEach((r: any) => myMap.set(r.post_id, r.reaction));

    setPosts(
      postRows.map((p: any) => ({
        ...p,
        profile: p.profile,
        like_count: likeMap.get(p.id) ?? 0,
        dislike_count: dislikeMap.get(p.id) ?? 0,
        comment_count: commentMap.get(p.id) ?? 0,
        my_reaction: myMap.get(p.id) ?? null,
      }))
    );
    setLoading(false);
  }, [filterUserId, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, refresh: fetchPosts };
};

export const togglePostReaction = async (
  postId: string,
  userId: string,
  current: "like" | "dislike" | null,
  next: "like" | "dislike"
) => {
  if (current === next) {
    await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    return null;
  }
  await supabase.from("post_reactions").upsert({ post_id: postId, user_id: userId, reaction: next });
  return next;
};
