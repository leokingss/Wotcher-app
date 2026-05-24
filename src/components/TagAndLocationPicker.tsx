import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, MapPin, Search, X, UserPlus, Building2, Navigation, Loader2 } from "lucide-react";
import { searchPlaces, getCurrentPosition, type PlaceResult } from "@/lib/places";

// Frontend-only tag people + location picker shared by Story and Post composers.

export type TaggedPerson = {
  handle: string;
  name: string;
  avatar: string;
  followed: boolean;      // is the current user following them?
  external?: boolean;     // searched via @ — not a follow
  business?: boolean;
};

export type LocationTag = {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  category: string;
};

// Mocks
const FOLLOWED: TaggedPerson[] = [
  { handle: "maya",   name: "Maya Reyes",     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop", followed: true },
  { handle: "jonas",  name: "Jonas Kim",      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop", followed: true },
  { handle: "rae",    name: "Rae Adler",      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop", followed: true },
  { handle: "kofi",   name: "Kofi Mensah",    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop", followed: true },
  { handle: "ines",   name: "Ines Costa",     avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop", followed: true },
  { handle: "leo",    name: "Leo Park",       avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop", followed: true },
];

const DISCOVERABLE: TaggedPerson[] = [
  { handle: "fkatwigs",     name: "FKA twigs",        avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop", followed: false },
  { handle: "kaytranada",   name: "Kaytranada",       avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop", followed: false },
  { handle: "bluenoteclub", name: "Blue Note Club",   avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=120&h=120&fit=crop", followed: false, business: true },
  { handle: "supremenyc",   name: "Supreme NYC",      avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop", followed: false, business: true },
  { handle: "rosaliavt",    name: "Rosalía",          avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120&h=120&fit=crop", followed: false },
];

const NEARBY: LocationTag[] = [
  { id: "1", name: "Blue Bottle Coffee",  address: "66 Mint St",         distanceM: 80,   category: "Café" },
  { id: "2", name: "House of Vans",       address: "Brick Lane",          distanceM: 220,  category: "Venue" },
  { id: "3", name: "Rough Trade Records", address: "Talbot Rd",           distanceM: 410,  category: "Record store" },
  { id: "4", name: "Soho Square",         address: "Soho",                distanceM: 540,  category: "Park" },
  { id: "5", name: "Boiler Room HQ",      address: "Hackney Wick",        distanceM: 980,  category: "Studio" },
  { id: "6", name: "Ace Hotel Lobby",     address: "100 Shoreditch High", distanceM: 1200, category: "Hotel" },
  { id: "7", name: "Phonica Records",     address: "51 Poland St",        distanceM: 1500, category: "Record store" },
];

interface Props {
  tagged: TaggedPerson[];
  setTagged: (next: TaggedPerson[]) => void;
  location: LocationTag | null;
  setLocation: (next: LocationTag | null) => void;
}

export default function TagAndLocationPicker({ tagged, setTagged, location, setLocation }: Props) {
  const [openPanel, setOpenPanel] = useState<null | "people" | "location">(null);
  const [query, setQuery] = useState("");

  const isExternalSearch = query.startsWith("@");
  const cleanQ = (isExternalSearch ? query.slice(1) : query).trim().toLowerCase();

  const peopleResults = useMemo(() => {
    const pool = isExternalSearch ? [...FOLLOWED, ...DISCOVERABLE] : FOLLOWED;
    if (!cleanQ) return pool;
    return pool.filter(
      (p) =>
        p.handle.toLowerCase().includes(cleanQ) ||
        p.name.toLowerCase().includes(cleanQ),
    );
  }, [cleanQ, isExternalSearch]);

  const locationResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NEARBY;
    return NEARBY.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q),
    );
  }, [query]);

  const togglePerson = (p: TaggedPerson) => {
    const exists = tagged.find((t) => t.handle === p.handle);
    if (exists) setTagged(tagged.filter((t) => t.handle !== p.handle));
    else setTagged([...tagged, { ...p, external: !p.followed }]);
  };

  const closePanel = () => {
    setOpenPanel(null);
    setQuery("");
  };

  const fmtDist = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

  return (
    <div className="space-y-2">
      {/* Action chips */}
      <div className="flex gap-2">
        <button
          onClick={() => setOpenPanel("people")}
          className="flex-1 neo-button rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-semibold"
        >
          <UserPlus className="w-4 h-4 text-primary" />
          {tagged.length > 0 ? `${tagged.length} tagged` : "Tag people"}
        </button>
        <button
          onClick={() => setOpenPanel("location")}
          className="flex-1 neo-button rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-semibold"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="truncate">{location ? location.name : "Add location"}</span>
        </button>
      </div>

      {/* Selected chips */}
      {(tagged.length > 0 || location) && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {location && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" /> {location.name}
              <button onClick={() => setLocation(null)} aria-label="Remove location">
                <X className="w-3 h-3 ml-0.5" />
              </button>
            </span>
          )}
          {tagged.map((t) => (
            <span
              key={t.handle}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-muted px-2 py-1 rounded-full"
            >
              <AtSign className="w-3 h-3 text-primary" />
              {t.handle}
              <button onClick={() => togglePerson(t)} aria-label={`Untag ${t.handle}`}>
                <X className="w-3 h-3 ml-0.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Inline panel */}
      {openPanel && (
        <div className="neo-card-inset rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {openPanel === "people" ? "Tag people" : "Choose a location"}
            </p>
            <button
              onClick={closePanel}
              className="neo-button-icon p-1 rounded-full"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="neo-card-inset rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                openPanel === "people"
                  ? "Search friends · type @ to find anyone"
                  : "Search nearby businesses & places"
              }
              maxLength={80}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {openPanel === "location" && !query && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Nearby
              </span>
            )}
          </div>

          {openPanel === "people" ? (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {isExternalSearch && (
                <p className="text-[10px] text-primary px-1 font-semibold">
                  Searching everyone on Watcher
                </p>
              )}
              {peopleResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No matches. Try @{cleanQ || "username"}
                </p>
              ) : (
                peopleResults.map((p) => {
                  const sel = !!tagged.find((t) => t.handle === p.handle);
                  return (
                    <button
                      key={p.handle}
                      onClick={() => togglePerson(p)}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${
                        sel ? "bg-primary/15" : "hover:bg-muted/40"
                      }`}
                    >
                      <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate flex items-center gap-1">
                          @{p.handle}
                          {p.business && (
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.name} · {p.followed ? "Following" : "Discover"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sel ? "bg-primary text-primary-foreground" : "neo-button"
                        }`}
                      >
                        {sel ? "Tagged" : "Tag"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2">
              {/* Pinned closest / EXIF-photo location — appears immediately under the search bar
                  so the user can one-tap the most likely spot. */}
              {!query && locationResults[0] && (() => {
                const top = locationResults[0];
                const sel = location?.id === top.id;
                return (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary px-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Where this was taken
                    </p>
                    <button
                      onClick={() => {
                        setLocation(sel ? null : top);
                        if (!sel) closePanel();
                      }}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors neo-card-inset ring-1 ${
                        sel ? "ring-primary bg-primary/15" : "ring-primary/30 hover:bg-muted/40"
                      }`}
                    >
                      <div className="neo-button-icon w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{top.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {top.category} · {top.address}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-primary tabular-nums">
                        {fmtDist(top.distanceM)}
                      </span>
                    </button>
                    {locationResults.length > 1 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-1">
                        Other nearby
                      </p>
                    )}
                  </div>
                );
              })()}

              {locationResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No places match "{query}"
                </p>
              ) : (
                (query ? locationResults : locationResults.slice(1)).map((l) => {
                  const sel = location?.id === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLocation(sel ? null : l);
                        if (!sel) closePanel();
                      }}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ${
                        sel ? "bg-primary/15" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="neo-button-icon w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{l.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {l.category} · {l.address}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {fmtDist(l.distanceM)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
