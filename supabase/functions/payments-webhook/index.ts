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
    payout_status: "pending_release",
  }).eq("stripe_checkout_session_id", session.id).eq("environment", env);

  if (kind === "buy_now") {
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
}

async function handlePaymentIntentSucceeded(pi: any, env: StripeEnv) {
  const sb = getSupabase();
  const { data: order } = await sb
    .from("marketplace_orders")
    .select("id, currency, amount_cents")
    .eq("stripe_payment_intent_id", pi.id)
    .eq("environment", env)
    .maybeSingle();
  if (!order) return;
  const chargeId = pi.latest_charge ?? null;
  await sb.from("marketplace_orders").update({
    stripe_charge_id: chargeId,
    paid_at: new Date().toISOString(),
    payout_status: "pending_release",
    status: "paid",
  }).eq("id", order.id);
  // Ledger: charge
  const { data: existing } = await sb.from("order_payments")
    .select("id").eq("order_id", order.id).eq("entry_type", "charge").maybeSingle();
  if (!existing) {
    await sb.from("order_payments").insert({
      order_id: order.id,
      entry_type: "charge",
      amount_cents: pi.amount_received ?? pi.amount ?? order.amount_cents,
      currency: (pi.currency ?? order.currency ?? "usd").toLowerCase(),
      stripe_object_id: pi.id,
      status: pi.status,
      environment: env,
      notes: "buyer paid platform",
    });
  }
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

async function handleIdentityVerification(session: any, env: StripeEnv) {
  const update: Record<string, unknown> = {
    status: session.status,
    last_error: session.last_error?.reason ?? null,
  };
  if (session.status === "verified") update.verified_at = new Date().toISOString();
  await getSupabase()
    .from("seller_identity_verifications")
    .update(update)
    .eq("stripe_verification_session_id", session.id)
    .eq("environment", env);
}

async function handleChargeRefunded(charge: any, env: StripeEnv) {
  const sb = getSupabase();
  const pi = charge.payment_intent;
  if (!pi) return;
  const refunded = charge.amount_refunded ?? charge.amount;
  const { data: order } = await sb
    .from("marketplace_orders").select("id")
    .eq("stripe_payment_intent_id", pi).eq("environment", env).maybeSingle();
  if (!order) return;
  await sb.rpc("mark_order_refunded", {
    _order_id: order.id,
    _amount_cents: refunded,
    _reason: "stripe_refund",
  });
}

async function handleDispute(dispute: any, env: StripeEnv, eventType: string) {
  const sb = getSupabase();
  const pi = dispute.payment_intent;
  if (!pi) return;
  const { data: order } = await sb
    .from("marketplace_orders").select("id, buyer_id, seller_id")
    .eq("stripe_payment_intent_id", pi).eq("environment", env).maybeSingle();
  if (!order) return;

  if (eventType === "charge.dispute.created") {
    await sb.from("disputes").insert({
      order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id,
      source: "stripe", reason: dispute.reason ?? "stripe_chargeback",
      details: `Stripe dispute ${dispute.id} (${dispute.status})`,
      stripe_dispute_id: dispute.id,
    });
    await sb.from("marketplace_orders").update({
      disputed_at: new Date().toISOString(),
      payout_status: "disputed",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
  } else if (eventType === "charge.dispute.closed") {
    const status = dispute.status === "lost" ? "refunded"
      : dispute.status === "won" ? "rejected" : "resolved";
    await sb.from("disputes").update({
      status, resolved_at: new Date().toISOString(),
      resolution_notes: `Stripe closed: ${dispute.status}`,
      updated_at: new Date().toISOString(),
    }).eq("stripe_dispute_id", dispute.id);
  }
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
      case "identity.verification_session.verified":
      case "identity.verification_session.requires_input":
      case "identity.verification_session.processing":
      case "identity.verification_session.canceled":
        await handleIdentityVerification(event.data.object, env);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object, env);
        break;
      case "charge.dispute.created":
      case "charge.dispute.closed":
      case "charge.dispute.updated":
        await handleDispute(event.data.object, env, event.type);
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
