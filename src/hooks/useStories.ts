import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { FriendCircleEnum } from "./useFriendCircles";

export type StoryMediaType = "photo" | "video" | "music";

export interface StoryFrameRow {
  audience_circle: FriendCircleEnum | null;
  id: string;
  user_id: string;
  media_type: StoryMediaType;
  media_url: string;
  caption: string | null;
  track_title: string | null;
  track_artist: string | null;
  created_at: string;
  expires_at: string;
  profile: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export interface GroupedStory {
  user_id: string;
  username: string;
  avatar: string | null;
  isOwn: boolean;
  mediaType: StoryMediaType;
  /** Audience of the most recent frame in the group (drives ring tint). */
  audienceCircle: FriendCircleEnum | null;
  frames: StoryFrameRow[];
}

const AVATAR_FALLBACK = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;

export const useStories = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<StoryFrameRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("stories")
      .select(
        "id, user_id, media_type, media_url, caption, track_title, track_artist, audience_circle, created_at, expires_at, profile:profiles!stories_user_id_fkey(username, display_name, avatar_url)"
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    setRows((data ?? []) as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("stories-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  // Group by user
  const grouped: GroupedStory[] = [];
  const byUser = new Map<string, StoryFrameRow[]>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(r);
  }
  for (const [uid, frames] of byUser) {
    const p = frames[0].profile;
    grouped.push({
      user_id: uid,
      username: p?.display_name || p?.username || "user",
      avatar: p?.avatar_url || AVATAR_FALLBACK(p?.username ?? uid),
      isOwn: !!user && uid === user.id,
      mediaType: frames[0].media_type,
      audienceCircle: frames[frames.length - 1].audience_circle ?? null,
      frames,
    });
  }
  // Own first
  grouped.sort((a, b) => (a.isOwn === b.isOwn ? 0 : a.isOwn ? -1 : 1));

  const markViewed = async (storyId: string) => {
    if (!user) return;
    await supabase
      .from("story_views")
      .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: "story_id,viewer_id" });
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    await supabase.from("stories").delete().eq("id", storyId).eq("user_id", user.id);
  };

  return { stories: grouped, rows, loading, markViewed, deleteStory, refresh: fetchAll };
};
