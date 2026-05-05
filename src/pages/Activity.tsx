import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/time";
import { Heart, HeartCrack, MessageCircle, UserPlus, Bell } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface Notif {
  id: string;
  type: "like" | "dislike" | "comment" | "follow";
  read: boolean;
  created_at: string;
  post_id: string | null;
  actor: { username: string; avatar_url: string | null } | null;
  post: { image_url: string } | null;
}

const typeIcon = { like: Heart, dislike: HeartCrack, comment: MessageCircle, follow: UserPlus };
const actionText = {
  like: "liked your post",
  dislike: "disliked your post",
  comment: "commented on your post",
  follow: "started following you",
};

const Activity = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, post_id, actor:profiles!notifications_actor_id_fkey(username, avatar_url), post:posts(image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifs((data ?? []) as any);
    // mark read
    const unread = (data ?? []).filter((n: any) => !n.read).map((n: any) => n.id);
    if (unread.length) await supabase.from("notifications").update({ read: true }).in("id", unread);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-center">
          <h1 className="font-semibold text-lg">Activity</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No activity yet" description="Likes, comments and follows will show up here." />
        ) : (
          <div className="space-y-3 pt-2">
            {notifs.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <div key={n.id} className="neo-card flex items-center gap-3 p-3 rounded-2xl">
                  <div className="neo-button-icon p-0.5 relative">
                    <img
                      src={n.actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${n.actor?.username}`}
                      alt={n.actor?.username ?? ""}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 neo-card p-1 rounded-full">
                      <Icon className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{n.actor?.username}</span>{" "}
                      <span className="text-muted-foreground">{actionText[n.type]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                  </div>
                  {n.post?.image_url ? (
                    <img src={n.post.image_url} alt="" className="w-11 h-11 rounded-lg object-cover" />
                  ) : n.type === "follow" ? (
                    <button className="bg-primary text-primary-foreground text-xs py-1.5 px-4 rounded-full font-medium">
                      Follow
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Activity;
