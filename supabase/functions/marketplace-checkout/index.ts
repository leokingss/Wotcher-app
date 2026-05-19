// Creates a Stripe Checkout session for either a buy-now purchase or settlement
// of a won auction. Platform takes 12% of the gross; the rest is the seller's
// net (paid out manually off-platform for now).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, createStripeClient, PLATFORM_FEE_BPS } from "../_shared/stripe.ts";

const STRIPE_ENV = "sandbox" as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

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
    const listingId: string | undefined = body.listing_id;
    const successUrl: string = body.success_url || `${req.headers.get("origin") ?? ""}/?paid=1`;
    const cancelUrl: string = body.cancel_url || `${req.headers.get("origin") ?? ""}/?canceled=1`;
    const shipping = body.shipping ?? null;

    if (!listingId) return json({ error: "listing_id required" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();
    if (lErr || !listing) return json({ error: "Listing not found" }, 404);
    if (listing.seller_id === user.id) return json({ error: "Cannot buy your own listing" }, 400);

    let kind: "buy_now" | "auction_win";
    let amount: number;

    if (listing.type === "fixed") {
      if (listing.status !== "active") return json({ error: "Listing not active" }, 400);
      kind = "buy_now";
      amount = Number(listing.price);
    } else {
      // auction
      if (listing.status !== "sold") return json({ error: "Auction not settled" }, 400);
      if (listing.current_bidder_id !== user.id) return json({ error: "You did not win this auction" }, 403);
      kind = "auction_win";
      amount = Number(listing.current_bid);
    }
    if (!amount || amount <= 0) return json({ error: "Invalid amount" }, 400);

    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
    const sellerNetCents = amountCents - platformFeeCents;

    // Reuse pending order if one exists for this listing+buyer
    const { data: existing } = await admin
      .from("marketplace_orders")
      .select("id, stripe_checkout_session_id, status")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .in("status", ["pending"])
      .maybeSingle();

    const stripe = createStripeClient(STRIPE_ENV);

    // Look up the seller's Stripe Connect account. If they're fully onboarded
    // (charges_enabled), use a destination charge so the buyer's payment is
    // auto-split: seller gets sellerNetCents, platform keeps the 12% fee.
    const { data: sellerAcct } = await admin
      .from("seller_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", listing.seller_id)
      .eq("environment", STRIPE_ENV)
      .maybeSingle();

    const useConnect = !!(sellerAcct?.charges_enabled && sellerAcct.stripe_account_id);

    const piMetadata = {
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: listing.title,
            description: listing.description?.slice(0, 500) || undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: user.email ?? undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      metadata: {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        kind,
        platform_fee_cents: String(platformFeeCents),
        seller_net_cents: String(sellerNetCents),
        payout_mode: useConnect ? "connect" : "manual",
      },
      payment_intent_data: {
        metadata: piMetadata,
        ...(useConnect
          ? {
              application_fee_amount: platformFeeCents,
              transfer_data: { destination: sellerAcct!.stripe_account_id! },
            }
          : {}),
      },
    });

    if (existing) {
      await admin.from("marketplace_orders").update({
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        seller_net_cents: sellerNetCents,
        stripe_checkout_session_id: session.id,
        shipping,
        kind,
      }).eq("id", existing.id);
    } else {
      await admin.from("marketplace_orders").insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        kind,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        seller_net_cents: sellerNetCents,
        currency: "usd",
        status: "pending",
        stripe_checkout_session_id: session.id,
        environment: STRIPE_ENV,
        shipping,
      });
    }

    return json({ url: session.url, session_id: session.id });
  } catch (e) {
    console.error("marketplace-checkout error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
