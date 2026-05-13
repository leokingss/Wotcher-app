import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart, HeartCrack, MessageCircle, UserPlus, Gavel, Trophy, Tag, Clock, Sparkles, Bell } from "lucide-react";
import { createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type NType = "like" | "dislike" | "comment" | "follow" | "outbid" | "auction_won" | "item_sold" | "auction_ending" | "new_listing" | "message";

const typeIcon: Record<string, any> = {
  like: Heart,
  dislike: HeartCrack,
  comment: MessageCircle,
  follow: UserPlus,
  outbid: Gavel,
  auction_won: Trophy,
  item_sold: Tag,
  auction_ending: Clock,
  new_listing: Sparkles,
  message: MessageCircle,
};

const actionText: Record<string, string> = {
  like: "liked your post",
  dislike: "disliked your post",
  comment: "commented on your post",
  follow: "started following you",
  outbid: "outbid you",
  auction_won: "you won the auction!",
  item_sold: "bought your item",
  auction_ending: "your auction is ending soon",
  new_listing: "posted a new listing",
  message: "sent you a message",
};

/**
 * Subscribes to the current user's notifications table and shows a sonner toast
 * for each new row. Suppressed when the user is already on the destination page
 * (Activity for general notifs, Messages for DMs) so nothing is double-surfaced.
 */
export const useNotificationToasts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    // Treat anything older than mount-time-2s as "already-seen" history
    initRef.current = Date.now() - 2000;

    const ch = supabase
      .channel(`notif-toasts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const n: any = payload.new;
          if (!n) return;
          const created = new Date(n.created_at).getTime();
          if (created < initRef.current) return;

          // Suppress if user is viewing the relevant page already
          const path = location.pathname;
          if (n.type === "message" && (path === "/messages" || path.startsWith("/messages/"))) return;
          if (n.type !== "message" && path === "/activity") return;

          // Resolve actor for nicer copy
          let actorName = "Someone";
          let avatar: string | null = null;
          if (n.actor_id) {
            const { data: p } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", n.actor_id)
              .maybeSingle();
            if (p?.username) actorName = p.username;
            avatar = p?.avatar_url ?? null;
          }

          const Icon = typeIcon[n.type] ?? Bell;
          const action = actionText[n.type] ?? "new activity";
          const isMessage = n.type === "message";
          const preview: string | undefined = n.metadata?.preview;

          toast.custom((t) => createElement(
            "div",
            {
              className: "neo-card flex items-center gap-3 p-3 rounded-2xl bg-background w-[320px] cursor-pointer",
              onClick: () => {
                toast.dismiss(t);
                if (isMessage && n.metadata?.conversation_id) {
                  navigate(`/messages/${n.metadata.conversation_id}`);
                } else {
                  navigate("/activity");
                }
              },
            },
            createElement(
              "div",
              { className: "neo-button-icon p-0.5 relative shrink-0" },
              createElement("img", {
                src: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${actorName}`,
                alt: actorName,
                className: "w-10 h-10 rounded-full object-cover",
              }),
              createElement(
                "div",
                { className: "absolute -bottom-1 -right-1 neo-card p-1 rounded-full" },
                createElement(Icon, {
                  className: `w-3 h-3 ${n.type === "dislike" ? "text-destructive" : "text-primary"}`,
                })
              )
            ),
            createElement(
              "div",
              { className: "flex-1 min-w-0" },
              createElement(
                "p",
                { className: "text-sm leading-tight" },
                createElement("span", { className: "font-semibold" }, actorName),
                " ",
                createElement("span", { className: "text-muted-foreground" }, action)
              ),
              preview &&
                createElement(
                  "p",
                  { className: "text-xs text-muted-foreground truncate mt-0.5" },
                  preview
                )
            )
          ), { duration: 5000 });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, navigate, location.pathname]);
};
