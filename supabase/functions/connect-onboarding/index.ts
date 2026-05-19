// Creates (or reuses) a Stripe Connect Express account for the calling seller
// and returns a Stripe-hosted onboarding URL.
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
    const origin = req.headers.get("origin") ?? "";
    const returnUrl: string = body.return_url || `${origin}/payouts?onboarded=1`;
    const refreshUrl: string = body.refresh_url || `${origin}/payouts?refresh=1`;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const stripe = createStripeClient(STRIPE_ENV);

    const { data: existing } = await admin
      .from("seller_stripe_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", STRIPE_ENV)
      .maybeSingle();

    let accountId = existing?.stripe_account_id as string | undefined;

    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      });
      accountId = acct.id;
      await admin.from("seller_stripe_accounts").insert({
        user_id: user.id,
        environment: STRIPE_ENV,
        stripe_account_id: acct.id,
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId!,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: "account_onboarding",
    });

    return json({ url: link.url, account_id: accountId });
  } catch (e) {
    console.error("connect-onboarding error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
