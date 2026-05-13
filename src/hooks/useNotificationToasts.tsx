import { useEffect, useRef, useState } from "react";
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

const settingsMap: Record<string, keyof NotifSettings> = {
  like: "toast_likes",
  dislike: "toast_likes",
  comment: "toast_comments",
  follow: "toast_follows",
  message: "toast_dms",
  outbid: "toast_auctions",
  auction_won: "toast_auctions",
  item_sold: "toast_auctions",
  auction_ending: "toast_auctions",
  new_listing: "toast_auctions",
};

interface NotifSettings {
  toast_likes: boolean;
  toast_comments: boolean;
  toast_follows: boolean;
  toast_dms: boolean;
  toast_auctions: boolean;
  toast_volume: number;
}

const defaultSettings: NotifSettings = {
  toast_likes: true,
  toast_comments: true,
  toast_follows: true,
  toast_dms: true,
  toast_auctions: true,
  toast_volume: 100,
};

type ToastHookState =
  | { settings: NotifSettings; fetchError: string | null }
  | NotifSettings;

const normalizeToastState = (state: ToastHookState): { settings: NotifSettings; fetchError: string | null } => {
  if ("settings" in state) return state;
  return { settings: state, fetchError: null };
};

/**
 * Subscribes to the current user's notifications table and shows a sonner toast
 * for each new row. Respects notification settings (type toggles + volume).
 * Suppressed when the user is already on the destination page.
 */
export const useNotificationToasts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initRef = useRef<number>(0);
  const [toastState, setToastState] = useState<ToastHookState>({ settings: defaultSettings, fetchError: null });
  const { settings, fetchError } = normalizeToastState(toastState);

  const loadSettings = () => {
    if (!user) return;
    setToastState((current) => ({ ...normalizeToastState(current), fetchError: null }));
    supabase
      .from("notification_settings")
      .select("toast_likes, toast_comments, toast_follows, toast_dms, toast_auctions, toast_volume")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(
        ({ data, error }) => {
        if (error) {
          setToastState((current) => ({ ...normalizeToastState(current), fetchError: "Could not load notification settings." }));
          return;
        }
        if (data) {
          setToastState({ settings: data as NotifSettings, fetchError: null });
        }
        },
        () => {
          setToastState((current) => ({ ...normalizeToastState(current), fetchError: "Could not load notification settings." }));
        }
      );
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (!user) return;
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

          // Respect type toggles + volume
          const settingKey = settingsMap[n.type];
          if (settingKey && !settings[settingKey]) return;
          if (settings.toast_volume === 0) return;

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
  }, [user, navigate, location.pathname, settings]);

  return { fetchError, retrySettings: loadSettings };
};
