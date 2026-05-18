import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";

export type BidderRegistration = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  declared_cap: number;
  approved_cap: number | null;
  expires_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
};

export const useBidderRegistration = (userId?: string | null) => {
  const [registration, setRegistration] = useState<BidderRegistration | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setRegistration(null); return; }
    setLoading(true);
    const { data } = await supabase
      .from("bidder_registrations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setRegistration((data as any) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const isApproved = !!(
    registration &&
    registration.status === "approved" &&
    registration.approved_cap &&
    (!registration.expires_at || new Date(registration.expires_at) > new Date())
  );

  return { registration, loading, refresh, isApproved };
};

export const startMarketplaceCheckout = async (listingId: string, shipping?: any) => {
  const { data, error } = await supabase.functions.invoke("marketplace-checkout", {
    body: {
      listing_id: listingId,
      shipping: shipping ?? null,
      success_url: `${window.location.origin}/?paid=1&listing=${listingId}`,
      cancel_url: `${window.location.origin}/?canceled=1&listing=${listingId}`,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("No checkout URL returned");
  window.location.href = data.url as string;
};
