import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Heart, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";
import { SortChips } from "@/components/SavedPostsView";
import StoryArchiveView from "@/components/StoryArchiveView";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "liked";
type ArchiveTab = "posts" | "stories";

interface ArchivedPost {
  id: string;
  image_url: string;
  caption: string | null;
  media_type: string;
  created_at: string;
  archived_at: string;
  like_count: number;
}

const archiveKey = (uid: string) => `watcher:archive:${uid}`;

export const getArchivedIds = (uid: string): Record<string, string> => {
  try {
    const raw = localStorage.getItem(archiveKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const togglePostArchive = (uid: string, postId: string): boolean => {
  const map = getArchivedIds(uid);
  if (map[postId]) {
    delete map[postId];
    localStorage.setItem(archiveKey(uid), JSON.stringify(map));
    return false;
  }
  map[postId] = new Date().toISOString();
  localStorage.setItem(archiveKey(uid), JSON.stringify(map));
  return true;
};

const ArchiveView = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<ArchiveTab>("posts");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const map = getArchivedIds(user.id);
      const ids = Object.keys(map);
      if (ids.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const [{ data: postRows }, { data: reactions }] = await Promise.all([
        supabase
          .from("posts")
          .select("id, image_url, caption, media_type, created_at")
          .in("id", ids)
          .eq("user_id", user.id),
        supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids),
      ]);
      const likeCounts: Record<string, number> = {};
      (reactions ?? []).forEach((r: any) => {
        if (r.reaction === "like") likeCounts[r.post_id] = (likeCounts[r.post_id] ?? 0) + 1;
      });
      const merged: ArchivedPost[] = (postRows ?? []).map((p: any) => ({
        ...p,
        archived_at: map[p.id] ?? p.created_at,
        like_count: likeCounts[p.id] ?? 0,
      }));
      setPosts(merged);
      setLoading(false);
    })();
  }, [user, tick]);

  const sorted = useMemo(() => {
    const arr = [...posts];
    if (sort === "newest") arr.sort((a, b) => b.archived_at.localeCompare(a.archived_at));
    else if (sort === "oldest") arr.sort((a, b) => a.archived_at.localeCompare(b.archived_at));
    else arr.sort((a, b) => b.like_count - a.like_count);
    return arr;
  }, [posts, sort]);

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    togglePostArchive(user.id, id);
    toast.success("Restored to your profile");
    setTick((t) => t + 1);
  };

  return (
    <div className="px-4 pb-8">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 neo-card-inset rounded-2xl p-1">
        {(["posts", "stories"] as ArchiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? "neo-button-active text-primary" : "text-muted-foreground"
            }`}
          >
            {t === "posts" ? "Posts" : "Stories"}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <>
          <SortChips sort={sort} onChange={setSort} count={posts.length} />
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="No archived posts"
              description="Archived posts are hidden from your profile but kept here for you."
            />
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {sorted.map((p) => (
                <Link
                  key={p.id}
                  to={`/post/${p.id}`}
                  className="relative aspect-square rounded-lg overflow-hidden neo-card-inset group"
                >
                  <img src={p.image_url} alt={p.caption ?? "Archived post"} className="w-full h-full object-cover opacity-90" loading="lazy" />
                  <button
                    onClick={(e) => handleRestore(e, p.id)}
                    className="absolute top-1 right-1 neo-button-icon w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Restore"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5 text-primary" />
                  </button>
                  {p.like_count > 0 && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-background/70 backdrop-blur px-1.5 py-0.5 rounded-full">
                      <Heart className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-[10px] font-semibold">{p.like_count}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "stories" && user && <StoryArchiveView userId={user.id} />}
    </div>
  );
};

export default ArchiveView;
