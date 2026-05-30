import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Gavel, Tag, Radio } from "lucide-react";
import { useChartsStore } from "@/hooks/useChartsStore";
import { sampleTracks } from "@/data/mockCharts";
import { MUSIC_GENRES, MusicGenre } from "@/components/FeedFilter";
import { useLive } from "@/hooks/useLiveStore";
import { OFFICIAL_ACCOUNTS } from "@/data/mockPhase5";

// Deterministically assign a genre per trackId
const genreForTrack = (id: string): MusicGenre => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return MUSIC_GENRES[h % MUSIC_GENRES.length];
};

// Mock product/auction inventory keyed by genre
const GENRE_PICKS: Record<string, { kind: "product" | "auction" | "creator"; title: string; subtitle: string; cover: string }[]> = {
  "Lo-Fi": [
    { kind: "product", title: "Vintage vinyl bundle", subtitle: "Fixed price · £42", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
    { kind: "product", title: "MPC 1000 sampler", subtitle: "Fixed price · £380", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
    { kind: "auction", title: "Limited cassette run", subtitle: "Live auction · ends 2h", cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop" },
  ],
  "Hip-Hop": [
    { kind: "product", title: "SP-404 mk2", subtitle: "Fixed price · £475", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
    { kind: "auction", title: "Signed gold chain", subtitle: "Live auction · ends 8h", cover: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=300&h=300&fit=crop" },
  ],
  "Electronic": [
    { kind: "product", title: "Modular synth starter", subtitle: "Fixed price · £640", cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
    { kind: "auction", title: "Roland TR-8S", subtitle: "Live auction · ends 4h", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop" },
  ],
  "Indie": [
    { kind: "product", title: "Fender Mustang", subtitle: "Fixed price · £520", cover: "https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=300&h=300&fit=crop" },
    { kind: "creator", title: "Lina Mareau", subtitle: "Indie pop · 12k followers", cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop" },
  ],
};

const FALLBACK = [
  { kind: "product" as const, title: "Studio headphones", subtitle: "Fixed price · £180", cover: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop" },
  { kind: "auction" as const, title: "Vintage amp", subtitle: "Live auction · ends 5h", cover: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=300&h=300&fit=crop" },
];

const ForYouRow = () => {
  const { currentTop10 } = useChartsStore();
  const { rooms } = useLive();

  const { topGenre, topArtist, recs, liveCount } = useMemo(() => {
    const tally: Record<string, number> = {};
    const artistTally: Record<string, number> = {};
    currentTop10.forEach((id, idx) => {
      const t = sampleTracks.find((tr) => tr.id === id);
      if (!t) return;
      const g = genreForTrack(id);
      tally[g] = (tally[g] ?? 0) + (10 - idx);
      artistTally[t.artist] = (artistTally[t.artist] ?? 0) + (10 - idx);
    });
    const topGenre = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Indie";
    const topArtist = Object.entries(artistTally).sort((a, b) => b[1] - a[1])[0]?.[0];
    const recs = (GENRE_PICKS[topGenre] ?? FALLBACK).slice(0, 4);
    return { topGenre, topArtist, recs, liveCount: rooms.filter((r) => r.kind === "auction").length };
  }, [currentTop10, rooms]);

  const officialMatch = topArtist
    ? Object.values(OFFICIAL_ACCOUNTS).find((a) => a.username.toLowerCase().includes((topArtist.split(" ")[0] ?? "").toLowerCase()))
    : undefined;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="neo-button-icon w-7 h-7 rounded-full flex items-center justify-center text-primary">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <h2 className="text-sm font-bold flex-1">
          For You
          <span className="block text-[11px] font-normal text-muted-foreground">
            Because you ranked <span className="text-primary font-semibold">{topGenre}</span>
            {liveCount > 0 && ` · ${liveCount} live auction${liveCount > 1 ? "s" : ""}`}
          </span>
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {recs.map((r, i) => (
          <Link
            key={i}
            to={r.kind === "auction" ? "/live" : r.kind === "creator" && officialMatch ? `/profile/${officialMatch.username}` : "/search"}
            className="shrink-0 w-40 neo-card rounded-2xl p-2"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden">
              <img src={r.cover} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 neo-card-inset rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 text-primary">
                {r.kind === "auction" ? <Radio className="w-3 h-3 text-destructive" /> : r.kind === "creator" ? <Sparkles className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                {r.kind === "auction" ? "Live" : r.kind === "creator" ? "Creator" : "Shop"}
              </span>
            </div>
            <p className="text-xs font-semibold mt-2 line-clamp-1">{r.title}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{r.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ForYouRow;
