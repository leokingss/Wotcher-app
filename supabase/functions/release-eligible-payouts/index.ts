// Cron-invoked: finds delivered orders past their release_after date with no
// open dispute and a verified seller Connect account, then runs
// stripe.transfers.create({ amount: seller_net_cents, destination }).
// Marketplace commission is already excluded (we only transfer seller_net_cents).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const STRIPE_ENV: StripeEnv = "sandbox";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const stripe = createStripeClient(STRIPE_ENV);

  const limit = 50;
  const { data: orders, error } = await sb
    .from("marketplace_orders")
    .select("id, seller_id, seller_net_cents, currency, stripe_payment_intent_id, stripe_charge_id, environment, release_after, status, payout_status")
    .eq("environment", STRIPE_ENV)
    .eq("payout_status", "pending_release")
    .eq("status", "delivered")
    .not("release_after", "is", null)
    .lte("release_after", new Date().toISOString())
    .limit(limit);

  if (error) {
    console.error("query error", error);
    return json({ error: error.message }, 500);
  }

  const results: any[] = [];
  for (const o of orders ?? []) {
    try {
      // Skip if open dispute
      const { data: openDispute } = await sb
        .from("disputes").select("id")
        .eq("order_id", o.id).eq("status", "open").maybeSingle();
      if (openDispute) { results.push({ id: o.id, skipped: "open_dispute" }); continue; }

      // Seller connect account must be verified
      const { data: acct } = await sb
        .from("seller_stripe_accounts")
        .select("stripe_account_id, charges_enabled, payouts_enabled")
        .eq("user_id", o.seller_id).eq("environment", STRIPE_ENV).maybeSingle();
      if (!acct?.stripe_account_id || !acct.charges_enabled || !acct.payouts_enabled) {
        results.push({ id: o.id, skipped: "seller_not_verified" });
        continue;
      }

      // Idempotency: use order id so retries don't double-transfer
      const transfer = await stripe.transfers.create(
        {
          amount: o.seller_net_cents,
          currency: (o.currency ?? "usd").toLowerCase(),
          destination: acct.stripe_account_id,
          source_transaction: o.stripe_charge_id ?? undefined,
          description: `Payout for order ${o.id}`,
          metadata: {
            order_id: o.id,
            seller_id: o.seller_id,
            seller_net_cents: String(o.seller_net_cents),
          },
        },
        { idempotencyKey: `order_payout_${o.id}` },
      );

      await sb.rpc("mark_order_released", {
        _order_id: o.id,
        _transfer_id: transfer.id,
        _amount_cents: o.seller_net_cents,
      });
      results.push({ id: o.id, transferred: transfer.id });
    } catch (e) {
      console.error("transfer failed for", o.id, e);
      results.push({ id: o.id, error: (e as Error).message });
    }
  }

  return json({ processed: results.length, results });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
