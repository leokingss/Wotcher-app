import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = async (uid: string) => {
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("read", false);
    setCount(c ?? 0);
  };

  useEffect(() => {
    if (!user) { setCount(0); return; }
    load(user.id);
    const channelName = `notifs-unread-${user.id}`;
    // Clean up any stale channel with the same name (HMR / StrictMode double-mount)
    supabase.getChannels()
      .filter((c) => c.topic === `realtime:${channelName}`)
      .forEach((c) => supabase.removeChannel(c));
    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(user.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return count;
};
