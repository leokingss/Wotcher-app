import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useIsStaff = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setIsModerator(false); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
      if (cancelled) return;
      const roles = new Set((data ?? []).map((r) => r.role));
      setIsAdmin(roles.has("admin"));
      setIsModerator(roles.has("moderator") || roles.has("admin"));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin, isModerator, isStaff: isAdmin || isModerator, loading: loading || authLoading };
};
