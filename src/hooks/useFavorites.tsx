import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Ctx {
  ids: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  loaded: boolean;
}

const FavoritesContext = createContext<Ctx | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setIds(new Set()); setLoaded(true); return; }
    setLoaded(false);
    supabase
      .from("listing_favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setIds(new Set((data ?? []).map((r: any) => r.listing_id)));
        setLoaded(true);
      });
  }, [user?.id]);

  const toggle = useCallback(async (listingId: string) => {
    if (!user) {
      toast({ title: "Sign in to save listings" });
      return;
    }
    const has = ids.has(listingId);
    // optimistic
    setIds((prev) => {
      const next = new Set(prev);
      has ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    const { error } = has
      ? await supabase.from("listing_favorites").delete().eq("user_id", user.id).eq("listing_id", listingId)
      : await supabase.from("listing_favorites").insert({ user_id: user.id, listing_id: listingId });
    if (error) {
      // revert
      setIds((prev) => {
        const next = new Set(prev);
        has ? next.add(listingId) : next.delete(listingId);
        return next;
      });
      toast({ title: "Couldn't update saved listings", variant: "destructive" });
    }
  }, [ids, user?.id]);

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite: (id) => ids.has(id), toggle, loaded }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
