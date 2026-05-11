import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type PostMediaType = "image" | "video" | "audio";

export interface PostListingSummary {
  id: string;
  type: "fixed" | "auction";
  status: "active" | "sold" | "ended" | "cancelled";
  price: number | null;
  current_bid: number | null;
  ends_at: string | null;
  title: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  caption: string | null;
  location: string | null;
  image_url: string;
  media_type: PostMediaType;
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
  listing: PostListingSummary | null;
}

export type FeedMode = "live" | "popular" | "algorithm";

export const usePosts = (filterUserId?: string, mode: FeedMode = "live") => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    // Popular looks back 30 days, Live/Algorithm pull recent 50
    let q = supabase
      .from("posts")
      .select("id, user_id, caption, location, image_url, media_type, created_at, profile:profiles!posts_user_id_fkey(username, display_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (filterUserId) {
      q = q.eq("user_id", filterUserId).limit(50);
    } else if (mode === "popular") {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      q = q.gte("created_at", since).limit(200);
    } else {
      q = q.limit(50);
    }

    const { data: postRows } = await q;
    if (!postRows) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const ids = postRows.map((p) => p.id);

    const followingPromise = (mode === "algorithm" && user)
      ? supabase.from("follows").select("following_id").eq("follower_id", user.id)
      : Promise.resolve({ data: [] as any[] });

    const [reactions, comments, mine, follows, listings] = await Promise.all([
      supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids),
      supabase.from("comments").select("post_id").in("post_id", ids),
      user
        ? supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids).eq("user_id", user.id)
        : Promise.resolve({ data: [] as any[] }),
      followingPromise,
      supabase
        .from("listings")
        .select("id, post_id, type, status, price, current_bid, ends_at, title, created_at")
        .in("post_id", ids)
        .in("status", ["active", "sold", "ended"])
        .order("created_at", { ascending: false }),
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
    const followingSet = new Set<string>(((follows.data ?? []) as any[]).map((f) => f.following_id));
    const listingMap = new Map<string, PostListingSummary>();
    ((listings.data ?? []) as any[]).forEach((l) => {
      if (l.post_id && !listingMap.has(l.post_id)) {
        listingMap.set(l.post_id, {
          id: l.id, type: l.type, status: l.status,
          price: l.price, current_bid: l.current_bid, ends_at: l.ends_at,
          title: l.title ?? null,
        });
      }
    });

    let result: FeedPost[] = postRows.map((p: any) => ({
      ...p,
      media_type: (p.media_type ?? "image") as PostMediaType,
      profile: p.profile,
      like_count: likeMap.get(p.id) ?? 0,
      dislike_count: dislikeMap.get(p.id) ?? 0,
      comment_count: commentMap.get(p.id) ?? 0,
      my_reaction: myMap.get(p.id) ?? null,
      listing: listingMap.get(p.id) ?? null,
    }));

    if (mode === "popular") {
      // Hot score: engagement weighted, slight recency boost
      const score = (p: FeedPost) => {
        const ageHrs = Math.max(1, (Date.now() - new Date(p.created_at).getTime()) / 36e5);
        const engagement = p.like_count * 2 + p.comment_count * 3 - p.dislike_count;
        return engagement / Math.pow(ageHrs, 0.4);
      };
      result = [...result].sort((a, b) => score(b) - score(a)).slice(0, 50);
    } else if (mode === "algorithm") {
      // Personalized: followed authors + engagement + recency
      const score = (p: FeedPost) => {
        const ageHrs = Math.max(1, (Date.now() - new Date(p.created_at).getTime()) / 36e5);
        const followBoost = followingSet.has(p.user_id) ? 25 : 0;
        const engagement = p.like_count * 1.5 + p.comment_count * 2 - p.dislike_count * 0.5;
        const recency = 30 / Math.pow(ageHrs, 0.5);
        return followBoost + engagement + recency;
      };
      result = [...result].sort((a, b) => score(b) - score(a));
    }
    // "live" stays in chronological order from the query

    setPosts(result);
    setLoading(false);
  }, [filterUserId, user, mode]);

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
