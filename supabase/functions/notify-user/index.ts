// Resolves userId -> email via auth.admin and forwards to send-transactional-email.
// Used by the client (outbid, item-sold from buyNow) and by other edge functions
// (settle-auctions for won/sold) to keep all transactional sends going through
// the single send-transactional-email function.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  userId: string;
  templateName: string;
  templateData?: Record<string, unknown>;
  idempotencyKey: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: Body;
  try { body = await req.json() as Body; } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { userId, templateName, templateData = {}, idempotencyKey } = body;
  if (!userId || !templateName || !idempotencyKey) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: u, error: uErr } = await admin.auth.admin.getUserById(userId);
  if (uErr || !u?.user?.email) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_email" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const r = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      templateName,
      recipientEmail: u.user.email,
      idempotencyKey,
      templateData,
    }),
  });

  const text = await r.text();
  return new Response(JSON.stringify({ ok: r.ok, status: r.status, response: text }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
