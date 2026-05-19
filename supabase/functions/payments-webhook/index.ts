// Stripe webhook: marks marketplace_orders paid and finalizes the listing
// (buy_now -> mark sold, snapshot shipping; auction_win -> just record payment).
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const sb = getSupabase();
  const listingId = session.metadata?.listing_id;
  const kind = session.metadata?.kind;
  if (!listingId) {
    console.error("checkout.session.completed missing listing_id metadata");
    return;
  }

  await sb.from("marketplace_orders").update({
    status: "paid",
    stripe_payment_intent_id: session.payment_intent ?? null,
    paid_at: new Date().toISOString(),
  }).eq("stripe_checkout_session_id", session.id).eq("environment", env);

  if (kind === "buy_now") {
    // Mark listing sold and snapshot shipping
    const { data: order } = await sb
      .from("marketplace_orders")
      .select("buyer_id, shipping")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    await sb.from("listings").update({
      status: "sold",
      current_bidder_id: order?.buyer_id ?? null,
      buyer_shipping: order?.shipping ?? null,
      sold_at: new Date().toISOString(),
    }).eq("id", listingId).eq("status", "active");
  }
  // For auction_win the listing is already 'sold' from settle-auctions.
}

async function handleCheckoutExpired(session: any, env: StripeEnv) {
  await getSupabase().from("marketplace_orders").update({
    status: "canceled",
  }).eq("stripe_checkout_session_id", session.id).eq("environment", env).eq("status", "pending");
}
async function handleAccountUpdated(account: any, env: StripeEnv) {
  await getSupabase().from("seller_stripe_accounts").update({
    charges_enabled: !!account.charges_enabled,
    payouts_enabled: !!account.payouts_enabled,
    details_submitted: !!account.details_submitted,
    requirements_due: account.requirements ?? null,
  }).eq("stripe_account_id", account.id).eq("environment", env);
}


Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object, env);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
