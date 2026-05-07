import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

export const useDefaultShippingAddress = (userId?: string | null) => {
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setAddress(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setAddress((data as ShippingAddress) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { address, loading, refresh };
};

export const upsertAddress = async (
  userId: string,
  payload: Omit<ShippingAddress, "id" | "user_id" | "is_default"> & { id?: string },
) => {
  if (payload.id) {
    return supabase.from("shipping_addresses").update({ ...payload, user_id: userId }).eq("id", payload.id);
  }
  // Mark all existing as not default, insert new as default.
  await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", userId);
  return supabase.from("shipping_addresses").insert({ ...payload, user_id: userId, is_default: true });
};
