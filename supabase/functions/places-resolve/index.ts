import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const FIELD_MASK = "id,displayName,formattedAddress,location,types,addressComponents";

const rateBucket = new Map<string, { count: number; reset: number }>();
function checkRate(uid: string) {
  const now = Date.now();
  const b = rateBucket.get(uid);
  if (!b || now > b.reset) {
    rateBucket.set(uid, { count: 1, reset: now + 10_000 });
    return true;
  }
  if (b.count >= 20) return false;
  b.count++;
  return true;
}

function pickComponent(comps: any[] | undefined, type: string) {
  return comps?.find((c) => c.types?.includes(type))?.longText ?? null;
}
function classifyType(types: string[] = []) {
  if (types.includes("locality") || types.includes("postal_town")) return "city";
  if (types.includes("postal_code")) return "postcode";
  if (types.includes("street_address") || types.includes("premise")) return "address";
  if (types.includes("tourist_attraction") || types.includes("landmark")) return "landmark";
  return "venue";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await sb.auth.getUser();
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!checkRate(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const placeId: string = typeof body.place_id === "string" ? body.place_id : "";
    if (!placeId || placeId.length > 256 || !/^[A-Za-z0-9_\-]+$/.test(placeId)) {
      return new Response(JSON.stringify({ error: "Invalid place_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate via Google Places Details
    const url = `${GATEWAY_URL}/places/v1/places/${encodeURIComponent(placeId)}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "Place lookup failed", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lat = data.location?.latitude;
    const lng = data.location?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "Place missing coordinates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const place = {
      provider: "google",
      provider_place_id: data.id,
      name: data.displayName?.text ?? "",
      formatted_address: data.formattedAddress ?? null,
      city:
        pickComponent(data.addressComponents, "locality") ||
        pickComponent(data.addressComponents, "postal_town") ||
        pickComponent(data.addressComponents, "administrative_area_level_2"),
      region: pickComponent(data.addressComponents, "administrative_area_level_1"),
      country: pickComponent(data.addressComponents, "country"),
      latitude: lat,
      longitude: lng,
      place_type: classifyType(data.types),
    };

    // Upsert via service role to dedupe across users
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: existing } = await admin
      .from("locations")
      .select("*")
      .eq("provider", place.provider)
      .eq("provider_place_id", place.provider_place_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ location: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error } = await admin
      .from("locations")
      .insert(place)
      .select()
      .single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ location: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown";
    console.error("places-resolve error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
