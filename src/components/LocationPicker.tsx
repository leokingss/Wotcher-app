import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X, Navigation, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  PlaceResult,
  SavedLocation,
  searchPlaces,
  resolvePlace,
  getCurrentPosition,
  formatDistance,
} from "@/lib/places";

interface LocationPickerProps {
  value: SavedLocation | null;
  onChange: (loc: SavedLocation | null) => void;
  triggerLabel?: string;
}

export function LocationPicker({ value, onChange, triggerLabel = "Add location" }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<"unknown" | "denied" | "granted">("unknown");
  const debounceRef = useRef<number | null>(null);

  // Fetch nearby on open if we have coords (only when query is empty)
  useEffect(() => {
    if (!open) return;
    if (!coords) return;
    if (query.trim().length >= 1) return;
    let cancelled = false;
    setLoading(true);
    searchPlaces({ mode: "nearby", lat: coords.lat, lng: coords.lng })
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, coords, query]);

  // Live search on every keystroke (no debounce) — Instagram-style
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) return;
    let cancelled = false;
    setLoading(true);
    searchPlaces({
      mode: "text",
      query: q,
    })
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, coords, open]);

  async function requestLocation() {
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setPermission("granted");
    } catch (e: unknown) {
      setPermission("denied");
      toast.error("Location access denied. You can still search manually.");
    }
  }

  async function selectPlace(p: PlaceResult) {
    setResolving(p.provider_place_id);
    try {
      const loc = await resolvePlace(p.provider_place_id);
      onChange(loc);
      setOpen(false);
      setQuery("");
      setResults([]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save location";
      toast.error(msg);
    } finally {
      setResolving(null);
    }
  }

  return (
    <>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/40 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate">{value.name}</span>
          <button
            type="button"
            aria-label="Remove location"
            onClick={() => onChange(null)}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full neo-button-inset text-sm text-muted-foreground hover:text-foreground transition"
        >
          <MapPin className="h-4 w-4" />
          <span>{triggerLabel}</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add location</DialogTitle>
            <DialogDescription>
              We use your location only to find nearby places. Coordinates aren't stored or shown
              publicly unless you select a public place.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search city, place, postcode…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {!coords && permission !== "denied" && (
            <Button
              type="button"
              variant="secondary"
              onClick={requestLocation}
              className="w-full justify-start gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use current location
            </Button>
          )}

          <div className="flex-1 overflow-y-auto -mx-2">
            {loading && (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                {query.length >= 1 ? "No places found." : "Search or use your location to begin."}
              </p>
            )}
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.provider_place_id}>
                  <button
                    type="button"
                    onClick={() => selectPlace(r)}
                    disabled={resolving === r.provider_place_id}
                    className="w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition disabled:opacity-60"
                  >
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[r.city, r.country].filter(Boolean).join(", ") || r.formatted_address}
                      </div>
                    </div>
                    {r.distance_km != null && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistance(r.distance_km)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
