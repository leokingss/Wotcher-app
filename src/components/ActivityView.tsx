import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Video, Camera, Grid3X3, Trash2, Heart, Play, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tab = "posts" | "comments" | "videos" | "stories";

interface PostRow {
  id: string;
  image_url: string;
  caption: string | null;
  media_type: string;
  created_at: string;
}
interface CommentRow {
  id: string;
  text: string;
  created_at: string;
  post_id: string;
  postPreview?: { image_url: string } | null;
}
interface VideoRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
  duration_seconds: number | null;
}
interface StoryRow {
  id: string;
  thumbnail: string;
  caption: string;
  mediaType: "music" | "photo" | "video";
  created_at: string;
}

const myStoriesKey = (uid: string) => `watcher:my-stories:${uid}`;

export const getMyPostedStories = (uid: string): StoryRow[] => {
  try {
    const raw = localStorage.getItem(myStoriesKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const removeMyPostedStory = (uid: string, id: string) => {
  const list = getMyPostedStories(uid).filter((s) => s.id !== id);
  localStorage.setItem(myStoriesKey(uid), JSON.stringify(list));
};

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "posts", label: "Posts", icon: Grid3X3 },
  { key: "comments", label: "Comments", icon: MessageCircle },
  { key: "videos", label: "Videos", icon: Video },
  { key: "stories", label: "Stories", icon: Camera },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
};

const ActivityView = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [confirm, setConfirm] = useState<{ kind: Tab; id: string; label?: string } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [postsRes, commentsRes, videosRes] = await Promise.all([
        supabase.from("posts").select("id, image_url, caption, media_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, text, created_at, post_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("videos").select("id, title, thumbnail_url, created_at, duration_seconds").eq("artist_id", user.id).order("created_at", { ascending: false }),
      ]);
      setPosts((postsRes.data ?? []) as PostRow[]);
      const cmts = (commentsRes.data ?? []) as CommentRow[];
      // Hydrate post previews for comments
      const postIds = [...new Set(cmts.map((c) => c.post_id))];
      if (postIds.length > 0) {
        const { data: previews } = await supabase.from("posts").select("id, image_url").in("id", postIds);
        const map = new Map((previews ?? []).map((p: any) => [p.id, { image_url: p.image_url }]));
        setComments(cmts.map((c) => ({ ...c, postPreview: map.get(c.post_id) ?? null })));
      } else {
        setComments(cmts);
      }
      setVideos((videosRes.data ?? []) as VideoRow[]);
      setStories(getMyPostedStories(user.id));
      setLoading(false);
    })();
  }, [user, tick]);

  const counts = useMemo(
    () => ({ posts: posts.length, comments: comments.length, videos: videos.length, stories: stories.length }),
    [posts, comments, videos, stories]
  );

  const performDelete = async () => {
    if (!confirm || !user) return;
    const { kind, id } = confirm;
    let error: any = null;
    if (kind === "posts") ({ error } = await supabase.from("posts").delete().eq("id", id));
    else if (kind === "comments") ({ error } = await supabase.from("comments").delete().eq("id", id));
    else if (kind === "videos") ({ error } = await supabase.from("videos").delete().eq("id", id));
    else if (kind === "stories") removeMyPostedStory(user.id, id);
    setConfirm(null);
    if (error) {
      toast.error(error.message ?? "Could not delete");
      return;
    }
    toast.success("Deleted");
    setTick((t) => t + 1);
  };

  const askDelete = (kind: Tab, id: string, label?: string) => setConfirm({ kind, id, label });

  return (
    <div className="px-4 pb-8">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 neo-card-inset rounded-2xl p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                active ? "neo-button-active text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="text-[9px] opacity-70">{counts[t.key]}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
      ) : (
        <>
          {tab === "posts" && (
            posts.length === 0 ? (
              <EmptyState icon={Grid3X3} title="No posts yet" description="Posts you publish will appear here." />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {posts.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden neo-card-inset group">
                    <Link to={`/post/${p.id}`}>
                      <img src={p.image_url} alt={p.caption ?? "Post"} className="w-full h-full object-cover" loading="lazy" />
                    </Link>
                    <button
                      onClick={() => askDelete("posts", p.id, p.caption ?? "this post")}
                      className="absolute top-1 right-1 neo-button-icon w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                    <div className="absolute bottom-1 left-1 text-[10px] font-semibold bg-background/70 backdrop-blur px-1.5 py-0.5 rounded-full">
                      {formatDate(p.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "comments" && (
            comments.length === 0 ? (
              <EmptyState icon={MessageCircle} title="No comments yet" description="Comments you write will show here." />
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="neo-card-inset rounded-2xl p-3 flex items-center gap-3">
                    <Link to={`/post/${c.post_id}`} className="neo-button-icon w-12 h-12 flex-shrink-0 overflow-hidden rounded-full">
                      {c.postPreview?.image_url ? (
                        <img src={c.postPreview.image_url} alt="post" className="w-full h-full object-cover" />
                      ) : (
                        <MessageCircle className="w-4 h-4 m-auto text-muted-foreground" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{c.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(c.created_at)}</p>
                    </div>
                    <button
                      onClick={() => askDelete("comments", c.id, c.text.slice(0, 40))}
                      className="neo-button-icon w-9 h-9 flex items-center justify-center flex-shrink-0"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "videos" && (
            videos.length === 0 ? (
              <EmptyState icon={Video} title="No videos yet" description="Videos you upload will appear here." />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {videos.map((v) => (
                  <div key={v.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden neo-card-inset group">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-10">
                      <p className="text-xs font-semibold truncate">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(v.created_at)}</p>
                    </div>
                    <button
                      onClick={() => askDelete("videos", v.id, v.title)}
                      className="absolute top-2 right-2 neo-button-icon w-8 h-8 flex items-center justify-center"
                      aria-label="Delete video"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "stories" && (
            stories.length === 0 ? (
              <EmptyState icon={Camera} title="No stories posted" description="Stories you publish appear here for 24 hours, then auto-archive." />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {stories.map((s) => {
                  const Icon = s.mediaType === "video" ? Play : s.mediaType === "music" ? Music : Camera;
                  return (
                    <div key={s.id} className="relative aspect-[9/16] rounded-lg overflow-hidden neo-card-inset group">
                      <img src={s.thumbnail} alt={s.caption} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-1.5 left-1.5 neo-button-icon w-6 h-6 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-foreground" />
                      </div>
                      <button
                        onClick={() => askDelete("stories", s.id, s.caption)}
                        className="absolute top-1.5 right-1.5 neo-button-icon w-7 h-7 flex items-center justify-center"
                        aria-label="Delete story"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 text-[10px] font-semibold bg-background/70 backdrop-blur px-1.5 py-0.5 rounded-full text-center">
                        {formatDate(s.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {confirm?.kind.replace(/s$/, "")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.label ? `"${confirm.label}" ` : ""}This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityView;
