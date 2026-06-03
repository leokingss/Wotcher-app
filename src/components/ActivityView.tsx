import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Video, Camera, Grid3X3, Trash2, Heart, HeartCrack, Play, Music, Loader2, Bell, UserPlus, AtSign, Gavel, Trophy, Tag, Sparkles, Clock, Gift, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { formatRelative } from "@/lib/time";
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

type Tab = "inbox" | "posts" | "comments" | "videos" | "stories";

type NType = "like" | "dislike" | "comment" | "follow" | "mention" | "outbid" | "auction_won" | "item_sold" | "auction_ending" | "new_listing" | "drop" | "packet";

interface Notif {
  id: string;
  type: NType;
  read: boolean;
  created_at: string;
  post_id: string | null;
  listing_id: string | null;
  metadata: any;
  actor: { id: string; username: string; avatar_url: string | null } | null;
  post: { image_url: string } | null;
  listing: { title: string; seller_id: string } | null;
}

const typeIcon: Record<NType, any> = {
  like: Heart,
  dislike: HeartCrack,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  outbid: Gavel,
  auction_won: Trophy,
  item_sold: Tag,
  auction_ending: Clock,
  new_listing: Sparkles,
  drop: Gift,
  packet: PartyPopper,
};

const actionText: Record<NType, string> = {
  like: "liked your photo",
  dislike: "disliked your photo",
  comment: "commented on your photo",
  follow: "started following you",
  mention: "mentioned you in a story",
  outbid: "outbid you",
  auction_won: "— you won the auction!",
  item_sold: "bought your item",
  auction_ending: "your auction is ending soon",
  new_listing: "posted a new listing",
  drop: "sent you a drop",
  packet: "sent you a red packet",
};

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
  { key: "inbox", label: "Inbox", icon: Bell },
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

const MARKET_TYPES: NType[] = ["outbid", "auction_won", "item_sold", "auction_ending", "new_listing"];

const ActivityView = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { drops, packets, claimedDropIds } = useWallet();
  const [tab, setTab] = useState<Tab>("inbox");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [confirm, setConfirm] = useState<{ kind: Exclude<Tab, "inbox">; id: string; label?: string } | null>(null);
  const [tick, setTick] = useState(0);

  // Comments infinite scroll state
  const COMMENTS_PAGE = 20;
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hydrateComments = async (rows: CommentRow[]): Promise<CommentRow[]> => {
    const postIds = [...new Set(rows.map((c) => c.post_id))];
    if (postIds.length === 0) return rows;
    const { data: previews } = await supabase.from("posts").select("id, image_url").in("id", postIds);
    const map = new Map((previews ?? []).map((p: any) => [p.id, { image_url: p.image_url }]));
    return rows.map((c) => ({ ...c, postPreview: map.get(c.post_id) ?? null }));
  };

  const loadMoreComments = useCallback(async () => {
    if (!user || commentsLoadingMore || !commentsHasMore) return;
    setCommentsLoadingMore(true);
    const from = comments.length;
    const to = from + COMMENTS_PAGE - 1;
    const { data } = await supabase
      .from("comments")
      .select("id, text, created_at, post_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    const rows = (data ?? []) as CommentRow[];
    const hydrated = await hydrateComments(rows);
    setComments((prev) => [...prev, ...hydrated]);
    setCommentsHasMore(rows.length === COMMENTS_PAGE);
    setCommentsLoadingMore(false);
  }, [user, comments.length, commentsLoadingMore, commentsHasMore]);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, post_id, listing_id, metadata, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url), post:posts(image_url), listing:listings(title, seller_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifs((data ?? []) as any);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [postsRes, commentsRes, commentsCount, videosRes] = await Promise.all([
        supabase.from("posts").select("id, image_url, caption, media_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, text, created_at, post_id").eq("user_id", user.id).order("created_at", { ascending: false }).range(0, COMMENTS_PAGE - 1),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("videos").select("id, title, thumbnail_url, created_at, duration_seconds").eq("artist_id", user.id).order("created_at", { ascending: false }),
      ]);
      setPosts((postsRes.data ?? []) as PostRow[]);
      const firstPage = (commentsRes.data ?? []) as CommentRow[];
      setComments(await hydrateComments(firstPage));
      setCommentsTotal(commentsCount.count ?? firstPage.length);
      setCommentsHasMore(firstPage.length === COMMENTS_PAGE);
      setVideos((videosRes.data ?? []) as VideoRow[]);
      setStories(getMyPostedStories(user.id));
      await loadNotifs();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tick]);

  // Realtime for notifications
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("activityview-notifs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => loadNotifs()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadNotifs]);

  // IntersectionObserver for infinite scroll on comments tab
  useEffect(() => {
    if (tab !== "comments" || !sentinelRef.current || !commentsHasMore) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreComments();
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tab, commentsHasMore, loadMoreComments]);

  const username = profile?.username ?? "you";

  const virtualNotifs = useMemo<Notif[]>(() => {
    const items: Notif[] = [];
    const now = Date.now();
    drops.forEach((d) => {
      if (claimedDropIds.includes(d.id)) return;
      items.push({
        id: `drop:${d.id}`,
        type: "drop",
        read: false,
        created_at: new Date(now - 60_000).toISOString(),
        post_id: null,
        listing_id: null,
        metadata: { dropId: d.id, title: d.title },
        actor: { id: d.creator, username: d.creator, avatar_url: d.creatorAvatar },
        post: null,
        listing: null,
      });
    });
    packets.forEach((p) => {
      const remaining = p.shares.filter((s) => !s.claimedBy).length;
      if (remaining === 0) return;
      if (p.shares.some((s) => s.claimedBy === username)) return;
      items.push({
        id: `packet:${p.id}`,
        type: "packet",
        read: false,
        created_at: new Date(p.createdAt).toISOString(),
        post_id: null,
        listing_id: null,
        metadata: { packetId: p.id, greeting: p.greeting, pool: p.pool, remaining },
        actor: { id: p.creator, username: p.creator, avatar_url: p.creatorAvatar },
        post: null,
        listing: null,
      });
    });
    return items;
  }, [drops, packets, claimedDropIds, username]);

  const allNotifs = useMemo(() => {
    return [...virtualNotifs, ...notifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifs, virtualNotifs]);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = async (n: Notif) => {
    if (n.type === "drop" || n.type === "packet") {
      navigate("/wallet");
      return;
    }
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.listing_id && n.listing?.seller_id) {
      const { data: p } = await supabase.from("profiles").select("username").eq("id", n.listing.seller_id).maybeSingle();
      if (p?.username) navigate(`/profile/${p.username}?tab=shop`);
      return;
    }
    if ((n.type === "follow" || n.type === "mention") && n.actor?.username) {
      navigate(`/profile/${n.actor.username}`);
      return;
    }
    if (n.post_id && n.actor?.username) {
      navigate(`/profile/${n.actor.username}`);
    }
  };

  const counts = useMemo(
    () => ({ inbox: allNotifs.length, posts: posts.length, comments: commentsTotal, videos: videos.length, stories: stories.length }),
    [allNotifs, posts, commentsTotal, videos, stories]
  );

  // Pending deletes (soft-delete with 60s undo window)
  const pendingRef = useRef<Map<string, { timer: number; restore: () => void; commit: () => Promise<void> }>>(new Map());

  const performDelete = async () => {
    if (!confirm || !user) return;
    const { kind, id, label } = confirm;
    setConfirm(null);

    const key = `${kind}:${id}`;
    let restore: () => void = () => {};
    let commit: () => Promise<void> = async () => {};

    if (kind === "posts") {
      const snapshot = posts.find((p) => p.id === id);
      const idx = posts.findIndex((p) => p.id === id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      restore = () => snapshot && setPosts((prev) => {
        const next = [...prev];
        next.splice(Math.min(idx, next.length), 0, snapshot);
        return next;
      });
      commit = async () => { await supabase.from("posts").delete().eq("id", id); };
    } else if (kind === "comments") {
      const snapshot = comments.find((c) => c.id === id);
      const idx = comments.findIndex((c) => c.id === id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setCommentsTotal((n) => Math.max(0, n - 1));
      restore = () => snapshot && setComments((prev) => {
        const next = [...prev];
        next.splice(Math.min(idx, next.length), 0, snapshot);
        return next;
      });
      commit = async () => { await supabase.from("comments").delete().eq("id", id); };
      const origRestore = restore;
      restore = () => { origRestore(); setCommentsTotal((n) => n + 1); };
    } else if (kind === "videos") {
      const snapshot = videos.find((v) => v.id === id);
      const idx = videos.findIndex((v) => v.id === id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      restore = () => snapshot && setVideos((prev) => {
        const next = [...prev];
        next.splice(Math.min(idx, next.length), 0, snapshot);
        return next;
      });
      commit = async () => { await supabase.from("videos").delete().eq("id", id); };
    } else if (kind === "stories") {
      const snapshot = stories.find((s) => s.id === id);
      const idx = stories.findIndex((s) => s.id === id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      restore = () => {
        if (!snapshot) return;
        const current = getMyPostedStories(user.id);
        if (!current.find((s) => s.id === snapshot.id)) {
          const next = [...current];
          next.splice(Math.min(idx, next.length), 0, snapshot);
          localStorage.setItem(`watcher:my-stories:${user.id}`, JSON.stringify(next));
        }
        setStories(getMyPostedStories(user.id));
      };
      commit = async () => { removeMyPostedStory(user.id, id); };
    }

    const finalize = async () => {
      pendingRef.current.delete(key);
      try { await commit(); } catch (e: any) {
        toast.error(e?.message ?? "Could not delete");
        restore();
      }
    };

    const timer = window.setTimeout(finalize, 60_000);
    pendingRef.current.set(key, { timer, restore, commit });

    toast(`${label ? `"${label.slice(0, 30)}" ` : ""}deleted`, {
      duration: 60_000,
      action: {
        label: "Undo",
        onClick: () => {
          const entry = pendingRef.current.get(key);
          if (!entry) return;
          clearTimeout(entry.timer);
          pendingRef.current.delete(key);
          entry.restore();
          toast.success("Restored");
        },
      },
    });
  };

  useEffect(() => {
    return () => {
      pendingRef.current.forEach(({ timer, commit }) => {
        clearTimeout(timer);
        commit().catch(() => {});
      });
      pendingRef.current.clear();
    };
  }, []);

  const askDelete = (kind: Exclude<Tab, "inbox">, id: string, label?: string) => setConfirm({ kind, id, label });

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
          {tab === "inbox" && (
            allNotifs.length === 0 ? (
              <EmptyState icon={Bell} title="No activity yet" description="Likes, comments, follows, drops and packets will show up here." />
            ) : (
              <>
                {unread > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={markAllRead}
                      className="neo-button px-3 py-1.5 rounded-full text-[11px] text-primary"
                    >
                      Mark all read · {unread}
                    </button>
                  </div>
                )}
                <ul className="space-y-2">
                  {allNotifs.map((n) => {
                    const Icon = typeIcon[n.type] ?? Bell;
                    const isMarketplace = MARKET_TYPES.includes(n.type);
                    const isDropOrPacket = n.type === "drop" || n.type === "packet";
                    return (
                      <li
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`neo-card rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] ${!n.read ? "ring-1 ring-primary/30" : ""}`}
                      >
                        <div className="neo-button-icon p-0.5 relative shrink-0">
                          <img
                            src={n.actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${n.actor?.username ?? "system"}`}
                            alt={n.actor?.username ?? ""}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          <div className={`absolute -bottom-1 -right-1 bg-background border border-border p-1 rounded-full ${isMarketplace || isDropOrPacket ? "text-primary" : ""}`}>
                            <Icon className={`w-3 h-3 ${n.type === "dislike" ? "text-destructive" : "text-primary"}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <button onClick={() => n.actor?.username && navigate(`/profile/${n.actor.username}`)} className="font-semibold hover:underline">
                              @{n.actor?.username ?? "someone"}
                            </button>{" "}
                            <span className="text-muted-foreground">{actionText[n.type]}</span>
                            {n.listing?.title && (
                              <span className="text-foreground font-medium"> · {n.listing.title}</span>
                            )}
                            {n.type === "drop" && n.metadata?.title && (
                              <span className="text-foreground font-medium"> · {n.metadata.title}</span>
                            )}
                            {n.type === "packet" && n.metadata?.pool != null && (
                              <span className="text-primary font-semibold"> · £{Number(n.metadata.pool).toFixed(2)}</span>
                            )}
                            {n.metadata?.amount && n.type === "outbid" && (
                              <span className="text-primary font-semibold"> (${Number(n.metadata.amount).toFixed(2)})</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                        </div>
                        {n.post?.image_url && (
                          <img src={n.post.image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )
          )}

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
              <>
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
                        aria-label="Delete comment permanently"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
                {commentsHasMore ? (
                  <div ref={sentinelRef} className="flex items-center justify-center py-6">
                    {commentsLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                ) : (
                  <p className="text-center text-[11px] text-muted-foreground py-6">
                    You've reached the end · {commentsTotal} comment{commentsTotal === 1 ? "" : "s"}
                  </p>
                )}
              </>
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
