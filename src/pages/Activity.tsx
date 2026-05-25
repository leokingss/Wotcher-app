import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/time";
import { Heart, HeartCrack, MessageCircle, UserPlus, Bell, Gavel, Trophy, Tag, Sparkles, Clock, CheckCheck, AtSign } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";

type NType = "like" | "dislike" | "comment" | "follow" | "mention" | "outbid" | "auction_won" | "item_sold" | "auction_ending" | "new_listing";

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
};

const actionText: Record<NType, string> = {
  like: "liked your post",
  dislike: "disliked your post",
  comment: "commented on your post",
  follow: "started following you",
  mention: "mentioned you in a story",
  outbid: "outbid you",
  auction_won: "— you won the auction!",
  item_sold: "bought your item",
  auction_ending: "your auction is ending soon",
  new_listing: "posted a new listing",
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
};

type FilterCat = "all" | "social" | "marketplace" | "unread";
type TimeRange = "all" | "today" | "week" | "month";

const CATS: { id: FilterCat; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "social", label: "Social" },
  { id: "marketplace", label: "Marketplace" },
];

const TIMES: { id: TimeRange; label: string }[] = [
  { id: "all", label: "Anytime" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const SOCIAL_TYPES: NType[] = ["like", "dislike", "comment", "follow", "mention"];
const MARKET_TYPES: NType[] = ["outbid", "auction_won", "item_sold", "auction_ending", "new_listing"];

const Activity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [cat, setCat] = useState<FilterCat>("all");
  const [time, setTime] = useState<TimeRange>("all");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, post_id, listing_id, metadata, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url), post:posts(image_url), listing:listings(title, seller_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifs((data ?? []) as any);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("notifs-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff: Record<TimeRange, number> = {
      all: 0,
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return notifs.filter((n) => {
      if (cat === "unread" && n.read) return false;
      if (cat === "social" && !SOCIAL_TYPES.includes(n.type)) return false;
      if (cat === "marketplace" && !MARKET_TYPES.includes(n.type)) return false;
      if (time !== "all" && now - new Date(n.created_at).getTime() > cutoff[time]) return false;
      return true;
    });
  }, [notifs, cat, time]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notif[]>();
    filtered.forEach((n) => {
      const k = dayLabel(n.created_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(n);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggleRead = async (e: React.MouseEvent, n: Notif) => {
    e.stopPropagation();
    const next = !n.read;
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: next } : x)));
    await supabase.from("notifications").update({ read: next }).eq("id", n.id);
  };

  const handleClick = async (n: Notif) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.listing_id && n.listing?.seller_id) {
      const { data: p } = await supabase.from("profiles").select("username").eq("id", n.listing.seller_id).maybeSingle();
      if (p?.username) navigate(`/profile/${p.username}?tab=shop`);
      return;
    }
    if (n.type === "follow" && n.actor?.username) {
      navigate(`/profile/${n.actor.username}`);
      return;
    }
    if (n.post_id && n.actor?.username) {
      navigate(`/profile/${n.actor.username}`);
    }
  };

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Activity</h1>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="neo-button-icon px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 text-primary"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-2 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {CATS.map((c) => {
            const count = c.id === "unread" ? unread : undefined;
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? "neo-button-icon text-primary" : "neo-card text-muted-foreground"}`}
              >
                {c.label}{count !== undefined && count > 0 ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {TIMES.map((t) => {
            const active = time === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTime(t.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] transition-all ${active ? "neo-button-icon text-foreground" : "text-muted-foreground"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-3">
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No activity yet" description="Likes, comments, follows and marketplace updates will show up here." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here" description="No notifications match these filters." />
        ) : (
          <div className="space-y-6 pt-2">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">{day}</h2>
                <div className="space-y-2">
                  {items.map((n) => {
                    const Icon = typeIcon[n.type] ?? Bell;
                    const isMarketplace = MARKET_TYPES.includes(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full text-left neo-card flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer ${!n.read ? "ring-1 ring-primary/30" : ""}`}
                      >
                        <div className="neo-button-icon p-0.5 relative shrink-0">
                          <img
                            src={n.actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${n.actor?.username ?? "system"}`}
                            alt={n.actor?.username ?? ""}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          <div className={`absolute -bottom-1 -right-1 neo-card p-1 rounded-full ${isMarketplace ? "text-primary" : ""}`}>
                            <Icon className={`w-3 h-3 ${n.type === "dislike" ? "text-destructive" : "text-primary"}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{n.actor?.username ?? "Someone"}</span>{" "}
                            <span className="text-muted-foreground">{actionText[n.type]}</span>
                            {n.listing?.title && (
                              <span className="text-foreground font-medium"> · {n.listing.title}</span>
                            )}
                            {n.metadata?.amount && (n.type === "outbid") && (
                              <span className="text-primary font-semibold"> (${Number(n.metadata.amount).toFixed(2)})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                        </div>
                        <button
                          onClick={(e) => toggleRead(e, n)}
                          aria-label={n.read ? "Mark as unread" : "Mark as read"}
                          className="neo-button-icon p-2 rounded-full shrink-0"
                        >
                          {n.read ? (
                            <span className="block w-2 h-2 rounded-full bg-muted-foreground/40" />
                          ) : (
                            <span className="block w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                        {n.post?.image_url && (
                          <img src={n.post.image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Activity;
