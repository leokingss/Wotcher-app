## Location Tagging System

A unified location-tagging feature using **Google Maps Platform** (Places API New + Geocoding) routed through the Lovable connector gateway so the API key stays server-side. Reuses existing patterns from `TagAndLocationPicker` and `StoryComposer`.

### 1. Provider & infrastructure

- Connect the **Google Maps Platform** connector (gateway-enabled). API key never reaches the browser.
- Two edge functions:
  - `places-search` — handles "nearby" and "text" search, returns normalized results with distance from caller's lat/lng.
  - `places-details` — fetches canonical place details by `place_id` before persisting (validates provider IDs).
- In-memory LRU cache inside each function for repeat queries (60s TTL) — no DB cache table.
- Auth required (verifies JWT via `supabase.auth.getUser`) on both functions.

### 2. Database

New normalized `locations` table (one row per unique provider place, deduped on `provider + provider_place_id`):

```text
locations
├─ id uuid pk
├─ provider text          -- 'google'
├─ provider_place_id text -- Google place id
├─ name text
├─ formatted_address text
├─ city text
├─ region text
├─ country text
├─ latitude numeric
├─ longitude numeric
├─ place_type text        -- 'city' | 'venue' | 'landmark' | 'address' | 'postcode'
├─ created_at timestamptz
└─ unique(provider, provider_place_id)
```

Add nullable `location_id uuid references locations(id)` to: `posts`, `videos`, `stories`, `listings`, `profiles`, `livestreams` (only tables that exist; livestreams added if missing is out of scope — flagged below).

Posts already have a free-text `location` column — keep it for legacy, prefer `location_id` going forward.

RLS: `locations` is world-readable (public reference data), insertable only by authenticated users via the edge function (service role write).

### 3. Frontend

Refactor existing `TagAndLocationPicker` into a shared **`LocationPicker`** component:

- "Use current location" button — triggers `navigator.geolocation` with a clear privacy preface ("We use your location only to find nearby places. Coordinates aren't stored or shown publicly unless you pick a public place.").
- Permission denied → graceful fallback to manual text search.
- Debounced (300 ms) text input, calls `places-search` with `mode: 'text' | 'nearby'`.
- Pinned "Where you are" suggestion at top when GPS available.
- Result row: name • city, country • distance.
- Selected preview chip with × to remove.

Wire `LocationPicker` into:
- `StoryComposer` (replace current location section)
- `CreatePost` / video upload dialog
- Marketplace listing form
- Livestream start dialog (if present)
- Profile edit dialog

### 4. Feed display

`LocationLabel` component shown under `@username`:

```text
@username
London, United Kingdom
```

Tapping opens a read-only place card (name, formatted address, map thumbnail via static map proxy — optional, gated behind same gateway).

### 5. Marketplace

- Listing cards show city + approximate distance ("≈ 3 km away") computed from viewer's GPS.
- Marketplace filter: `Near me` toggle + radius slider (5/25/100/500 km / Any). Uses Haversine on lat/lng client-side over the already-fetched listing set; no DB-side geo index needed at this scale.
- Privacy: never expose exact lat/lng of the seller's address — only the chosen place's lat/lng (which is a public POI by design).

### 6. Privacy & security

- GPS coordinates are sent only to the edge function for the duration of the search; never persisted against the user.
- Selected place's lat/lng are public (it's a POI), so safe to display.
- Rate limit per user via simple in-memory token bucket inside the edge function (10 req / 10 s) — flagged as best-effort per platform guidance.
- Edge function validates `place_id` by calling Places Details before insert.
- API key only in edge functions (gateway), never in client bundle.

### Out of scope / flagged

- `livestreams` table doesn't currently exist in schema — will add `location_id` only if/when it's created.
- Static map thumbnails on the place card are optional; can ship without and add later.
- No background/continuous location tracking. One-shot GPS only when the user taps "Use current location".

### Technical notes

- Gateway base: `https://connector-gateway.lovable.dev/google_maps`
- Endpoints used:
  - `POST places/v1/places:searchNearby` (nearby)
  - `POST places/v1/places:searchText` (typed)
  - `GET  places/v1/places/{placeId}` (details / validation)
- Field mask kept minimal: `places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents`.
- Distance computed server-side with Haversine when caller passes lat/lng.

### Approval needed

This touches the schema (new `locations` table + FKs on 5 existing tables), adds 2 edge functions, and links the Google Maps connector. Approve to proceed and I'll start with the connector + migration, then ship the shared `LocationPicker` and integrate it call-site by call-site.
