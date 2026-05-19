// Refunds a marketplace order. Sellers can refund their own orders; admins can
// refund any. Reverses the application fee + the transfer to the connected
// account when destination charges were used.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, createStripeClient } from "../_shared/stripe.ts";

const STRIPE_ENV = "sandbox" as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body.order_id;
    const reason: string = (body.reason ?? "").toString().slice(0, 500);
    const amountCentsOverride: number | undefined = body.amount_cents;
    if (!orderId) return json({ error: "order_id required" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: order, error: oErr } = await admin
      .from("marketplace_orders").select("*").eq("id", orderId).maybeSingle();
    if (oErr || !order) return json({ error: "Order not found" }, 404);

    // Auth: seller of the order or admin
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const isSeller = order.seller_id === user.id;
    if (!isAdmin && !isSeller) return json({ error: "Forbidden" }, 403);

    if (!["paid", "shipped", "delivered"].includes(order.status)) {
      return json({ error: `Cannot refund order in status '${order.status}'` }, 400);
    }
    if (!order.stripe_payment_intent_id) {
      return json({ error: "No payment intent on this order" }, 400);
    }

    const amount = Math.min(
      amountCentsOverride && amountCentsOverride > 0 ? amountCentsOverride : order.amount_cents,
      order.amount_cents,
    );

    const stripe = createStripeClient(STRIPE_ENV);
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount,
      reverse_transfer: true,
      refund_application_fee: true,
      metadata: { order_id: orderId, refunded_by: user.id, reason: reason || "" },
    });

    await admin.rpc("mark_order_refunded", {
      _order_id: orderId,
      _amount_cents: amount,
      _reason: reason || null,
    });

    return json({ ok: true, refund_id: refund.id, amount_cents: amount });
  } catch (e) {
    console.error("refund-order error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
