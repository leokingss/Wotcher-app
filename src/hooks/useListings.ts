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

// Sample auctions for preview / demo when the DB has no live auctions yet.
export const SAMPLE_AUCTIONS: Listing[] = [
  {
    id: "sample-1", post_id: null, seller_id: "s1", type: "auction",
    title: "Vintage Leica M3 — 1958", description: "A beautifully preserved vintage rangefinder camera from 1958. Fully functional with original leather case and lens cap. A collector's dream piece with minimal wear and fully serviced mechanics.",
    price: null, starting_bid: 480, current_bid: 720, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 47).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1606986628253-49b5b6e7fdb1?w=800&q=80",
    shipping_required: true, return_policy: "15_days", fulfillment: "shipping",
  },
  {
    id: "sample-2", post_id: null, seller_id: "s2", type: "auction",
    title: "Hand-thrown ceramic vase", description: "One-of-a-kind stoneware vase with a natural ash glaze. Thrown on a wheel and fired in a wood kiln. Perfect for dried flowers or as a standalone art piece.",
    price: null, starting_bid: 60, current_bid: 145, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80",
    shipping_required: true, return_policy: "30_days", fulfillment: "shipping",
  },
  {
    id: "sample-3", post_id: null, seller_id: "s3", type: "auction",
    title: "First-press vinyl · 1972", description: "Rare first pressing from 1972. Vinyl in near-mint condition with original sleeve. A must-have for any serious collector of classic rock.",
    price: null, starting_bid: 25, current_bid: 88, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    shipping_required: true, return_policy: "none", fulfillment: "shipping",
  },
  {
    id: "sample-4", post_id: null, seller_id: "s4", type: "auction",
    title: "Mid-century lounge chair", description: "Authentic mid-century modern lounge chair in walnut and oatmeal boucle. Recently reupholstered. Solid construction with classic Danish design lines.",
    price: null, starting_bid: 200, current_bid: null, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 38).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    shipping_required: true, return_policy: "30_days", fulfillment: "shipping",
  },
  {
    id: "sample-5", post_id: null, seller_id: "s5", type: "auction",
    title: "Signed art print — edition of 50", description: "Limited edition screen print, signed and numbered by the artist. Printed on 300gsm archival cotton paper. Unframed, ships in a protective tube.",
    price: null, starting_bid: 90, current_bid: 120, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 52).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
    shipping_required: true, return_policy: "15_days", fulfillment: "shipping",
  },
  {
    id: "sample-6", post_id: null, seller_id: "s6", type: "auction",
    title: "Rolex Submariner · 1989", description: "Classic 1989 Rolex Submariner reference 16610. Original bezel insert, recently serviced. Comes with box and papers. A timeless investment piece.",
    price: null, starting_bid: 3200, current_bid: 4800, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    shipping_required: true, return_policy: "none", fulfillment: "shipping",
  },
  {
    id: "sample-7", post_id: null, seller_id: "s7", type: "auction",
    title: "Polaroid SX-70 · fully serviced", description: "Fully restored Polaroid SX-70 with new leather covering and cleaned optics. Film-tested and working perfectly. Includes carrying case and 2 packs of film.",
    price: null, starting_bid: 140, current_bid: 180, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&q=80",
    shipping_required: true, return_policy: "30_days", fulfillment: "shipping",
  },
  {
    id: "sample-8", post_id: null, seller_id: "s8", type: "auction",
    title: "Handmade silver pendant", description: "Hand-forged sterling silver pendant with a natural moonstone. Each piece is unique, made by a local artisan. Chain included, 45cm length.",
    price: null, starting_bid: 45, current_bid: null, current_bidder_id: null,
    ends_at: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
    status: "active", created_at: new Date().toISOString(),
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    shipping_required: true, return_policy: "15_days", fulfillment: "shipping",
  },
];

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
    // Return sample data directly for preview IDs (no DB round-trip)
    const sample = SAMPLE_AUCTIONS.find((s) => s.id === listingId);
    if (sample) {
      setListing(sample);
      setBids([]);
      setLoading(false);
      return;
    }
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
