// Returns the seller's current identity verification status.
// Pulls the latest from Stripe to bypass webhook lag, then mirrors into the DB.
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

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: row } = await admin
      .from("seller_identity_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", STRIPE_ENV)
      .maybeSingle();

    if (!row) return json({ exists: false, status: "not_started" });

    const stripe = createStripeClient(STRIPE_ENV);
    const session = await stripe.identity.verificationSessions.retrieve(
      row.stripe_verification_session_id as string,
    );

    const update: Record<string, unknown> = {
      status: session.status,
      last_error: session.last_error?.reason ?? null,
    };
    if (session.status === "verified") update.verified_at = new Date().toISOString();

    await admin.from("seller_identity_verifications")
      .update(update)
      .eq("stripe_verification_session_id", session.id);

    return json({
      exists: true,
      status: session.status,
      verified: session.status === "verified",
      last_error: session.last_error?.reason ?? null,
    });
  } catch (e) {
    console.error("identity-status error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
