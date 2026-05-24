import { supabase } from "@/integrations/supabase/client";

export interface PlaceResult {
  provider: string;
  provider_place_id: string;
  name: string;
  formatted_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  place_type: string | null;
  distance_km: number | null;
}

export interface SavedLocation {
  id: string;
  provider: string;
  provider_place_id: string;
  name: string;
  formatted_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  place_type: string | null;
}

export async function searchPlaces(args: {
  mode: "text" | "nearby";
  query?: string;
  lat?: number;
  lng?: number;
}): Promise<PlaceResult[]> {
  const { data, error } = await supabase.functions.invoke("places-search", {
    body: args,
  });
  if (error) throw error;
  return (data?.results ?? []) as PlaceResult[];
}

export async function resolvePlace(placeId: string): Promise<SavedLocation> {
  const { data, error } = await supabase.functions.invoke("places-resolve", {
    body: { place_id: placeId },
  });
  if (error) throw error;
  if (!data?.location) throw new Error("No location returned");
  return data.location as SavedLocation;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 60_000,
    });
  });
}

export function formatLocationLabel(loc: Pick<SavedLocation, "city" | "country" | "name">) {
  const parts = [loc.city, loc.country].filter(Boolean);
  if (parts.length === 0) return loc.name;
  return parts.join(", ");
}

export function formatDistance(km: number | null) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
