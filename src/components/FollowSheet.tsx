import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FriendCircleMenu from "./FriendCircleMenu";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FollowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "followers" | "following" | null;
  userId?: string | null;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const FollowSheet = ({ open, onOpenChange, type, userId }: FollowSheetProps) => {
  const title = type === "followers" ? "Followers" : "Following";
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !type || !userId) return;
    setLoading(true);
    (async () => {
      const col = type === "followers" ? "follower_id" : "following_id";
      const filterCol = type === "followers" ? "following_id" : "follower_id";
      const { data: rows } = await supabase.from("follows").select(`${col}`).eq(filterCol, userId);
      const ids = (rows ?? []).map((r: any) => r[col]).filter(Boolean);
      if (ids.length === 0) { setUsers([]); setLoading(false); return; }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      setUsers(profiles ?? []);
      setLoading(false);
    })();
  }, [open, type, userId]);

  const goToProfile = (username: string) => {
    onOpenChange(false);
    navigate(`/profile/${username.replace(/^@/, "")}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="neo-card border-0 rounded-t-3xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto pb-8">
          {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
          {!loading && users.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No {title.toLowerCase()} yet</p>
          )}
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <button onClick={() => goToProfile(u.username)} className="neo-card p-0.5 rounded-full">
                <img
                  src={u.avatar_url ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={u.username}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </button>
              <button onClick={() => goToProfile(u.username)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate">{u.username}</p>
                <p className="text-xs text-muted-foreground truncate">{u.display_name ?? u.username}</p>
              </button>
              <FriendCircleMenu username={u.username} memberId={u.id} variant={type === "followers" ? "pill" : "icon"} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FollowSheet;
