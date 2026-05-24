import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Per-user favourite filter ids. Persisted to `user_favorite_filters` when
 * signed in; falls back to a `localStorage` mirror so unauthenticated users
 * can still save preferences locally and the UI stays responsive offline.
 */
export const useFavoriteFilters = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Hydrate from local cache immediately to avoid flicker.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("story-fav-filters");
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  // When authed, hydrate from server (overwrite local cache).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_favorite_filters")
        .select("filter_id")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const next = new Set(data.map((r) => r.filter_id));
      setFavorites(next);
      localStorage.setItem("story-fav-filters", JSON.stringify([...next]));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (filterId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        next.has(filterId) ? next.delete(filterId) : next.add(filterId);
        localStorage.setItem("story-fav-filters", JSON.stringify([...next]));
        return next;
      });

      if (!user) return;
      const isFav = favorites.has(filterId);
      if (isFav) {
        await supabase
          .from("user_favorite_filters")
          .delete()
          .eq("user_id", user.id)
          .eq("filter_id", filterId);
      } else {
        await supabase
          .from("user_favorite_filters")
          .upsert(
            { user_id: user.id, filter_id: filterId },
            { onConflict: "user_id,filter_id" },
          );
      }
    },
    [user, favorites],
  );

  return { favorites, toggleFavorite: toggle };
};
