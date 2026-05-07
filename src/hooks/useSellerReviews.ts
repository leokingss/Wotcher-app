import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SellerReview {
  id: string;
  seller_id: string;
  buyer_id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer?: { username: string; avatar_url: string | null } | null;
}

export interface RatingSummary { avg_rating: number | null; review_count: number }

export const useSellerReviews = (sellerId?: string | null) => {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({ avg_rating: null, review_count: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sellerId) { setReviews([]); setSummary({ avg_rating: null, review_count: 0 }); setLoading(false); return; }
    setLoading(true);
    const [{ data: rows }, { data: sum }] = await Promise.all([
      supabase
        .from("seller_reviews")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_rating_summary")
        .select("*")
        .eq("seller_id", sellerId)
        .maybeSingle(),
    ]);
    const r = (rows ?? []) as SellerReview[];
    const ids = Array.from(new Set(r.map((x) => x.buyer_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      const pm = new Map<string, any>();
      (profs ?? []).forEach((p: any) => pm.set(p.id, p));
      setReviews(r.map((rv) => ({ ...rv, buyer: pm.get(rv.buyer_id) ?? null })));
    } else {
      setReviews(r);
    }
    setSummary(
      sum
        ? { avg_rating: Number((sum as any).avg_rating ?? 0), review_count: (sum as any).review_count ?? 0 }
        : { avg_rating: null, review_count: 0 },
    );
    setLoading(false);
  }, [sellerId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { reviews, summary, loading, refresh };
};

export const submitReview = async (
  sellerId: string,
  buyerId: string,
  listingId: string,
  rating: number,
  comment: string,
) => {
  return supabase.from("seller_reviews").insert({
    seller_id: sellerId,
    buyer_id: buyerId,
    listing_id: listingId,
    rating,
    comment: comment.trim() || null,
  });
};
