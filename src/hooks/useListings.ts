import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ListingType = "fixed" | "auction";
export type ListingStatus = "active" | "sold" | "ended" | "cancelled";

export interface Listing {
  id: string;
  post_id: string | null;
  seller_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  price: number | null;
  starting_bid: number | null;
  current_bid: number | null;
  current_bidder_id: string | null;
  ends_at: string | null;
  status: ListingStatus;
  created_at: string;
  image_url?: string | null;
  shipping_required?: boolean;
  sold_at?: string | null;
  buyer_shipping?: Record<string, any> | null;
  return_policy?: "none" | "15_days" | "30_days";
  fulfillment?: "shipping" | "pickup";
}

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder?: { username: string; avatar_url: string | null } | null;
}

/** Fetch listings keyed by post_id for a list of posts. */
export const useListingsByPosts = (postIds: string[]) => {
  const [map, setMap] = useState<Record<string, Listing>>({});
  const key = postIds.join(",");

  const fetch = useCallback(async () => {
    if (postIds.length === 0) { setMap({}); return; }
    const { data } = await supabase
      .from("listings")
      .select("*")
      .in("post_id", postIds)
      .eq("status", "active");
    const next: Record<string, Listing> = {};
    (data ?? []).forEach((l: any) => { if (l.post_id) next[l.post_id] = l; });
    setMap(next);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { map, refresh: fetch };
};

/** Fetch all active listings for a seller. */
export const useSellerListings = (sellerId?: string | null) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sellerId) { setListings([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*, posts:post_id(image_url)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((l: any) => ({ ...l, image_url: l.posts?.image_url ?? null })) as Listing[];
    setListings(rows);
    setLoading(false);
  }, [sellerId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { listings, loading, refresh };
};

/** Fetch listing + bid history. */
export const useListing = (listingId?: string | null) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!listingId) { setListing(null); setBids([]); setLoading(false); return; }
    setLoading(true);
    const [{ data: l }, { data: b }] = await Promise.all([
      supabase.from("listings").select("*").eq("id", listingId).maybeSingle(),
      supabase
        .from("bids")
        .select("id, listing_id, bidder_id, amount, created_at")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false }),
    ]);
    setListing((l as Listing) ?? null);
    const bidRows = (b ?? []) as Bid[];
    const ids = Array.from(new Set(bidRows.map((x) => x.bidder_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      const pm = new Map<string, any>();
      (profs ?? []).forEach((p: any) => pm.set(p.id, p));
      setBids(bidRows.map((br) => ({ ...br, bidder: pm.get(br.bidder_id) ?? null })));
    } else {
      setBids(bidRows);
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { listing, bids, loading, refresh };
};

export const placeBid = async (listingId: string, bidderId: string, amount: number) => {
  // Capture the current top bidder BEFORE inserting (DB trigger will overwrite it)
  const { data: pre } = await supabase
    .from("listings")
    .select("current_bidder_id, title")
    .eq("id", listingId)
    .maybeSingle();
  const prevBidderId = pre?.current_bidder_id ?? null;
  const itemTitle = pre?.title ?? "an auction";

  const result = await supabase.from("bids").insert({ listing_id: listingId, bidder_id: bidderId, amount });

  // If insert succeeded and there was a previous (different) bidder, email them
  if (!result.error && prevBidderId && prevBidderId !== bidderId) {
    supabase.functions
      .invoke("notify-user", {
        body: {
          userId: prevBidderId,
          templateName: "outbid",
          idempotencyKey: `outbid-${listingId}-${prevBidderId}-${amount}`,
          templateData: {
            itemTitle,
            newBid: Number(amount).toFixed(2),
            listingUrl: `${window.location.origin}/?listing=${listingId}`,
          },
        },
      })
      .catch((e) => console.error("outbid email failed", e));
  }

  return result;
};

export const buyNow = async (
  listing: Listing,
  _buyerId: string,
  shippingSnapshot?: Record<string, any> | null,
) => {
  // Real payment via Stripe Checkout. Webhook marks the listing sold and emails
  // the seller once payment clears.
  try {
    const { data, error } = await supabase.functions.invoke("marketplace-checkout", {
      body: {
        listing_id: listing.id,
        shipping: shippingSnapshot ?? null,
        success_url: `${window.location.origin}/?paid=1&listing=${listing.id}`,
        cancel_url: `${window.location.origin}/?canceled=1&listing=${listing.id}`,
      },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url as string;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const payForWonAuction = buyNow;
