import { useState } from "react";
import { Bell, Radio, Sparkles, Gift, ListOrdered, Megaphone, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNotificationCenter, NotifKind } from "@/hooks/useNotificationCenter";

const ICONS: Record<NotifKind, React.ComponentType<{ className?: string }>> = {
  live: Radio,
  drop: Sparkles,
  packet: Gift,
  rerank: ListOrdered,
  broadcast: Megaphone,
  groupbuy: Users,
};

const relative = (ms: number) => {
  const d = Date.now() - ms;
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const NotificationsPanel = () => {
  const { notifs, unread, markAllRead } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(markAllRead, 1200); }}>
      <SheetTrigger asChild>
        <button className="neo-button-icon p-2 relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-background border-l">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg">Notifications</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-72px)] p-3 space-y-2">
          {notifs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">You're all caught up.</p>
          )}
          {notifs.map((n) => {
            const Icon = ICONS[n.kind] ?? Bell;
            return (
              <button
                key={n.id}
                onClick={() => { if (n.href) { navigate(n.href); setOpen(false); } }}
                className={`w-full neo-card-inset rounded-xl p-3 flex gap-3 text-left ${!n.read ? "ring-1 ring-primary/40" : ""}`}
              >
                <div className="neo-button-icon w-10 h-10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{relative(n.at)}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;
