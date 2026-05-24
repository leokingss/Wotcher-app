import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents";

// In-memory caches & rate limit (best-effort)
const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_TTL_MS = 60_000;
const rateBucket = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20; // per window
const RATE_WINDOW_MS = 10_000;

function getCache(key: string) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return v.data;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
}

function checkRate(uid: string): boolean {
  const now = Date.now();
  const b = rateBucket.get(uid);
  if (!b || now > b.reset) {
    rateBucket.set(uid, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT) return false;
  b.count++;
  return true;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

function pickComponent(comps: AddressComponent[] | undefined, type: string) {
  return comps?.find((c) => c.types?.includes(type))?.longText ?? null;
}

function classifyType(types: string[] = []): string {
  if (types.includes("locality") || types.includes("postal_town")) return "city";
  if (types.includes("postal_code")) return "postcode";
  if (types.includes("street_address") || types.includes("premise")) return "address";
  if (types.includes("tourist_attraction") || types.includes("landmark")) return "landmark";
  return "venue";
}

function normalizePlace(p: any, userLat?: number, userLng?: number) {
  const lat = p.location?.latitude;
  const lng = p.location?.longitude;
  const city =
    pickComponent(p.addressComponents, "locality") ||
    pickComponent(p.addressComponents, "postal_town") ||
    pickComponent(p.addressComponents, "administrative_area_level_2");
  const region = pickComponent(p.addressComponents, "administrative_area_level_1");
  const country = pickComponent(p.addressComponents, "country");

  let distance_km: number | null = null;
  if (
    typeof userLat === "number" &&
    typeof userLng === "number" &&
    typeof lat === "number" &&
    typeof lng === "number"
  ) {
    distance_km = +haversine(userLat, userLng, lat, lng).toFixed(2);
  }

  return {
    provider: "google",
    provider_place_id: p.id,
    name: p.displayName?.text ?? "",
    formatted_address: p.formattedAddress ?? null,
    city,
    region,
    country,
    latitude: lat ?? null,
    longitude: lng ?? null,
    place_type: classifyType(p.types),
    distance_km,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Maps connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
    const mode: "nearby" | "text" = body.mode === "nearby" ? "nearby" : "text";
    const lat = typeof body.lat === "number" ? body.lat : undefined;
    const lng = typeof body.lng === "number" ? body.lng : undefined;
    const query: string = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";

    if (mode === "text" && query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "nearby" && (typeof lat !== "number" || typeof lng !== "number")) {
      return new Response(JSON.stringify({ error: "lat/lng required for nearby" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${mode}:${query}:${lat ?? ""}:${lng ?? ""}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url: string;
    let init: RequestInit;
    if (mode === "nearby") {
      url = `${GATEWAY_URL}/places/v1/places:searchNearby`;
      init = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({
          maxResultCount: 15,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: 2000 },
          },
        }),
      };
    } else {
      url = `${GATEWAY_URL}/places/v1/places:searchText`;
      const payload: Record<string, unknown> = { textQuery: query, maxResultCount: 15 };
      if (typeof lat === "number" && typeof lng === "number") {
        payload.locationBias = {
          circle: { center: { latitude: lat, longitude: lng }, radius: 50000 },
        };
      }
      init = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(payload),
      };
    }

    const resp = await fetch(url, init);
    const data = await resp.json();
    if (!resp.ok) {
      console.error("Google Places error", resp.status, data);
      return new Response(
        JSON.stringify({ error: "Place search failed", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = (data.places ?? []).map((p: any) => normalizePlace(p, lat, lng));
    if (typeof lat === "number" && typeof lng === "number") {
      results.sort((a: any, b: any) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    }

    const out = { results };
    setCache(cacheKey, out);
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("places-search error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
