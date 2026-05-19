// Creates a Stripe Identity VerificationSession for the calling seller.
// Requires document + selfie (matching the document) — Stripe handles capture,
// liveness, and selfie-to-document matching. No images touch our database.
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
    const returnUrl: string = body.return_url || `${origin}/payouts?identity=done`;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const stripe = createStripeClient(STRIPE_ENV);

    // Reuse an existing in-flight session if it isn't already verified/canceled.
    const { data: existing } = await admin
      .from("seller_identity_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", STRIPE_ENV)
      .maybeSingle();

    let sessionId = existing?.stripe_verification_session_id as string | undefined;
    let session: any;

    if (sessionId && existing?.status !== "verified" && existing?.status !== "canceled") {
      session = await stripe.identity.verificationSessions.retrieve(sessionId);
      // If Stripe says it's done in some terminal state we shouldn't reuse, create new.
      if (session.status === "canceled") session = null;
    }

    if (!session) {
      session = await stripe.identity.verificationSessions.create({
        type: "document",
        provided_details: { email: user.email ?? undefined },
        metadata: { user_id: user.id },
        options: {
          document: {
            require_matching_selfie: true,
            require_live_capture: true,
            require_id_number: false,
            allowed_types: ["driving_license", "passport", "id_card"],
          },
        },
        return_url: returnUrl,
      });

      await admin.from("seller_identity_verifications").upsert({
        user_id: user.id,
        environment: STRIPE_ENV,
        stripe_verification_session_id: session.id,
        status: session.status,
      }, { onConflict: "user_id,environment" });
    }

    return json({
      url: session.url,
      client_secret: session.client_secret,
      status: session.status,
    });
  } catch (e) {
    console.error("identity-start error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
