// Refreshes the seller's Stripe Connect onboarding status from Stripe.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, createStripeClient } from "../_shared/stripe.ts";

const STRIPE_ENV = "sandbox" as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "Method not allowed" }, 405);

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

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await admin
      .from("seller_stripe_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", STRIPE_ENV)
      .maybeSingle();

    if (!row) return json({ connected: false });

    const stripe = createStripeClient(STRIPE_ENV);
    const acct = await stripe.accounts.retrieve(row.stripe_account_id);

    await admin.from("seller_stripe_accounts").update({
      charges_enabled: !!acct.charges_enabled,
      payouts_enabled: !!acct.payouts_enabled,
      details_submitted: !!acct.details_submitted,
      requirements_due: acct.requirements ?? null,
    }).eq("id", row.id);

    return json({
      connected: true,
      account_id: row.stripe_account_id,
      charges_enabled: !!acct.charges_enabled,
      payouts_enabled: !!acct.payouts_enabled,
      details_submitted: !!acct.details_submitted,
      requirements_due: acct.requirements ?? null,
    });
  } catch (e) {
    console.error("connect-status error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
