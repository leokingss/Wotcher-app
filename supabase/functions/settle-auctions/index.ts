// Closes expired auctions: marks SOLD if there was a winning bid (otherwise ENDED),
// notifies the winner, the seller, and warns auctions ending within the next hour.
// Designed to run on a schedule (every minute via pg_cron).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();
  const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const inOneHourMinusMin = new Date(Date.now() + 59 * 60 * 1000).toISOString();

  const result = { settled_sold: 0, settled_ended: 0, ending_soon_notified: 0 };

  // 1. Find expired active auctions
  const { data: expired, error: exErr } = await supabase
    .from("listings")
    .select("id, seller_id, current_bidder_id, current_bid, title")
    .eq("type", "auction")
    .eq("status", "active")
    .lte("ends_at", now);

  if (exErr) {
    return new Response(JSON.stringify({ error: exErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const l of expired ?? []) {
    const hasWinner = !!l.current_bidder_id;
    const newStatus = hasWinner ? "sold" : "ended";
    const { error: upErr } = await supabase
      .from("listings")
      .update({ status: newStatus, sold_at: hasWinner ? now : null })
      .eq("id", l.id)
      .eq("status", "active"); // guard against race
    if (upErr) continue;

    if (hasWinner) {
      result.settled_sold++;
      // notify winner
      await supabase.from("notifications").insert({
        user_id: l.current_bidder_id!,
        actor_id: l.seller_id,
        type: "auction_won",
        listing_id: l.id,
        metadata: { amount: l.current_bid, title: l.title },
      });
      // notify seller
      await supabase.from("notifications").insert({
        user_id: l.seller_id,
        actor_id: l.current_bidder_id,
        type: "item_sold",
        listing_id: l.id,
        metadata: { amount: l.current_bid, title: l.title },
      });
    } else {
      result.settled_ended++;
    }
  }

  // 2. Notify owners of auctions ending in ~60 minutes (rolling window 59-60 min)
  const { data: endingSoon } = await supabase
    .from("listings")
    .select("id, seller_id, current_bidder_id, title")
    .eq("type", "auction")
    .eq("status", "active")
    .gte("ends_at", inOneHourMinusMin)
    .lte("ends_at", inOneHour);

  for (const l of endingSoon ?? []) {
    // notify seller + current top bidder once (idempotent-ish: we accept dupes are rare given window)
    const recipients = [l.seller_id, l.current_bidder_id].filter(Boolean) as string[];
    for (const uid of recipients) {
      // check we haven't already notified for this listing+type+user
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", uid)
        .eq("listing_id", l.id)
        .eq("type", "auction_ending")
        .limit(1)
        .maybeSingle();
      if (existing) continue;
      await supabase.from("notifications").insert({
        user_id: uid,
        actor_id: null,
        type: "auction_ending",
        listing_id: l.id,
        metadata: { title: l.title, ends_in: "1h" },
      });
      result.ending_soon_notified++;
    }
  }

  return new Response(JSON.stringify({ ok: true, ...result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
