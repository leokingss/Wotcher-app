import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Heart, Clock, ArrowDownAZ } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";

type SortKey = "newest" | "oldest" | "liked";

interface SavedPost {
  id: string;
  image_url: string;
  caption: string | null;
  media_type: string;
  created_at: string;
  added_at: string;
  like_count: number;
}

const SORTS: { key: SortKey; label: string; icon: any }[] = [
  { key: "newest", label: "Newest saved", icon: Clock },
  { key: "oldest", label: "Oldest saved", icon: ArrowDownAZ },
  { key: "liked", label: "Most liked", icon: Heart },
];

const SavedPostsView = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Get user's lists
      const { data: lists } = await supabase
        .from("saved_lists")
        .select("id")
        .eq("owner_id", user.id);
      const listIds = (lists ?? []).map((l: any) => l.id);
      if (listIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      // Saved post items
      const { data: items } = await supabase
        .from("saved_items")
        .select("item_id, added_at")
        .eq("item_type", "post")
        .in("list_id", listIds);
      const itemRows = (items ?? []) as { item_id: string; added_at: string }[];
      if (itemRows.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      // Dedupe (a post can be in multiple lists) — keep latest added_at
      const latestAdded = new Map<string, string>();
      itemRows.forEach((it) => {
        const prev = latestAdded.get(it.item_id);
        if (!prev || prev < it.added_at) latestAdded.set(it.item_id, it.added_at);
      });
      const ids = [...latestAdded.keys()];
      const [{ data: postRows }, { data: reactions }] = await Promise.all([
        supabase.from("posts").select("id, image_url, caption, media_type, created_at").in("id", ids),
        supabase.from("post_reactions").select("post_id, reaction").in("post_id", ids),
      ]);
      const likeCounts: Record<string, number> = {};
      (reactions ?? []).forEach((r: any) => {
        if (r.reaction === "like") likeCounts[r.post_id] = (likeCounts[r.post_id] ?? 0) + 1;
      });
      const merged: SavedPost[] = (postRows ?? []).map((p: any) => ({
        ...p,
        added_at: latestAdded.get(p.id) ?? p.created_at,
        like_count: likeCounts[p.id] ?? 0,
      }));
      setPosts(merged);
      setLoading(false);
    })();
  }, [user]);

  const sorted = useMemo(() => {
    const arr = [...posts];
    if (sort === "newest") arr.sort((a, b) => b.added_at.localeCompare(a.added_at));
    else if (sort === "oldest") arr.sort((a, b) => a.added_at.localeCompare(b.added_at));
    else arr.sort((a, b) => b.like_count - a.like_count);
    return arr;
  }, [posts, sort]);

  return (
    <div className="px-4 pb-8">
      <SortChips sort={sort} onChange={setSort} count={posts.length} />
      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved posts yet"
          description="Tap the bookmark icon on any post to save it here."
        />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {sorted.map((p) => (
            <Link
              key={p.id}
              to={`/post/${p.id}`}
              className="relative aspect-square rounded-lg overflow-hidden neo-card-inset group"
            >
              <img src={p.image_url} alt={p.caption ?? "Saved post"} className="w-full h-full object-cover" loading="lazy" />
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
    </div>
  );
};

export const SortChips = ({
  sort,
  onChange,
  count,
}: {
  sort: SortKey;
  onChange: (s: SortKey) => void;
  count: number;
}) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2 px-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {count} item{count === 1 ? "" : "s"}
      </span>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {SORTS.map((s) => {
        const Icon = s.icon;
        const active = sort === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              active ? "neo-button-pressed text-primary" : "neo-button-icon text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default SavedPostsView;
