// Admin overrides for marketplace payouts: release now, extend hold,
// mark disputed. (Refund is handled by the existing refund-order function.)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const STRIPE_ENV: StripeEnv = "sandbox";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const orderId: string = body.order_id;
    const action: "release" | "extend_hold" | "mark_disputed" = body.action;
    if (!orderId || !action) return json({ error: "order_id + action required" }, 400);

    if (action === "extend_hold") {
      const days = Number(body.days ?? 7);
      const { data, error } = await admin.rpc("admin_extend_hold", {
        _order_id: orderId, _extra_days: days, _notes: body.notes ?? null,
      });
      if (error) throw error;
      return json({ ok: true, order: data });
    }

    if (action === "mark_disputed") {
      const { data, error } = await admin.rpc("admin_mark_disputed", {
        _order_id: orderId, _notes: body.notes ?? null,
      });
      if (error) throw error;
      return json({ ok: true, order: data });
    }

    if (action === "release") {
      const { data: order, error: oErr } = await admin
        .from("marketplace_orders").select("*").eq("id", orderId).maybeSingle();
      if (oErr || !order) return json({ error: "Order not found" }, 404);
      if (!["pending_release", "held"].includes(order.payout_status)) {
        return json({ error: `Cannot release order in payout_status '${order.payout_status}'` }, 400);
      }
      const { data: acct } = await admin
        .from("seller_stripe_accounts")
        .select("stripe_account_id, charges_enabled, payouts_enabled")
        .eq("user_id", order.seller_id).eq("environment", STRIPE_ENV).maybeSingle();
      if (!acct?.stripe_account_id || !acct.charges_enabled || !acct.payouts_enabled) {
        return json({ error: "Seller Stripe account not verified" }, 400);
      }
      const stripe = createStripeClient(STRIPE_ENV);
      const transfer = await stripe.transfers.create(
        {
          amount: order.seller_net_cents,
          currency: (order.currency ?? "usd").toLowerCase(),
          destination: acct.stripe_account_id,
          source_transaction: order.stripe_charge_id ?? undefined,
          description: `Admin payout for order ${order.id}`,
          metadata: { order_id: order.id, released_by: user.id },
        },
        { idempotencyKey: `order_payout_${order.id}` },
      );
      await admin.rpc("mark_order_released", {
        _order_id: order.id, _transfer_id: transfer.id, _amount_cents: order.seller_net_cents,
      });
      return json({ ok: true, transfer_id: transfer.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-payout-action error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
