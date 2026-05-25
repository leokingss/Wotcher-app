import { useState } from "react";
import { Search, Music as MusicIcon } from "lucide-react";

interface PickedTrack {
  title: string;
  artist: string;
  coverUrl?: string | null;
  previewUrl?: string | null;
}

interface MusicPickerProps {
  onPick: (track: PickedTrack) => void;
}

/**
 * Curated mock library — in lieu of a third-party catalog, this gives the
 * sticker its avatar, title and artist instantly. The previewUrl points at
 * royalty-free SoundHelix tracks so the music sticker can play a snippet
 * during viewer playback (Phase 5+ may swap in a real provider).
 */
const LIBRARY: (PickedTrack & { tags: string })[] = [
  { title: "Velvet Hours", artist: "Lina", coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", tags: "indie chill" },
  { title: "Midnight Static", artist: "Ahmed Reza", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", tags: "synth electronic" },
  { title: "Paper Sun", artist: "Jenny Lou", coverUrl: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", tags: "folk acoustic" },
  { title: "Neon Bones", artist: "Karim K.", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", tags: "rap hip-hop" },
  { title: "Tidal", artist: "Sora", coverUrl: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", tags: "ambient lofi" },
  { title: "Sunday Drive", artist: "Pell + Mae", coverUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", tags: "pop summer" },
  { title: "Heatwave", artist: "Octave", coverUrl: "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", tags: "house dance" },
  { title: "Gravity Letter", artist: "Vesper", coverUrl: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=200&h=200&fit=crop", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", tags: "indie ballad" },
];

const MusicPicker = ({ onPick }: MusicPickerProps) => {
  const [query, setQuery] = useState("");
  const filtered = LIBRARY.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.tags.includes(q);
  });

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center neo-card-inset rounded-xl px-4 py-3 gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks or artists"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {filtered.map((t) => (
          <button
            key={t.title}
            onClick={() => onPick(t)}
            className="w-full flex items-center gap-3 p-2 rounded-xl neo-button hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {t.coverUrl ? (
                <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No tracks found.</p>
        )}
      </div>
    </div>
  );
};

export default MusicPicker;
