import { useState, useEffect } from "react";
import { Plus, Play, Pause, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SongCard from "./SongCard";
import { PlaylistItem } from "@/data/mockProfile";
import { usePlayer } from "@/hooks/usePlayer";
import VinylCounter from "./VinylCounter";

interface Top10ListProps {
  songs: PlaylistItem[];
  openCommentsId: string | number | null;
  onToggleComments: (id: string | number) => void;
  onAddSong?: () => void;
  isOwnProfile?: boolean;
}

const Top10List = ({ songs, openCommentsId, onToggleComments, onAddSong, isOwnProfile = true }: Top10ListProps) => {
  const top = songs.slice(0, 10);
  const remainingSlots = 10 - top.length;
  const { playingId, toggle } = usePlayer();

  // The currently expanded song (defaults to #1). Clicking another row promotes it.
  const [expandedId, setExpandedId] = useState<string | number | null>(top[0]?.id ?? null);

  useEffect(() => {
    if (expandedId == null && top[0]) setExpandedId(top[0].id);
  }, [top, expandedId]);

  const handleSelect = (id: string | number) => {
    setExpandedId(id);
    // Ensure mutually exclusive comment expansion: open clicked, close previous.
    if (openCommentsId !== id) onToggleComments(id);
  };

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="neo-card p-4 rounded-2xl flex items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Personal Chart</p>
          <h3 className="text-lg font-bold mt-0.5">My Top 10</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{top.length}/10 slots filled</p>
        </div>
        <VinylCounter filled={top.length} cover={top[0]?.cover} />
      </div>

      {/* Ordered list — selected song renders as hero, others as compact rows */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {top.map((song, idx) => {
            const rank = idx + 1;
            const isExpanded = expandedId === song.id;
            const isPlaying = playingId === song.id;

            if (isExpanded) {
              return (
                <motion.div
                  key={song.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="relative"
                >
                  <div className="absolute -top-2 -left-2 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center neo-card shadow-lg">
                    <span className="text-primary-foreground font-black text-lg leading-none">{rank}</span>
                  </div>
                  <div className="ring-2 ring-primary/40 rounded-xl">
                    <SongCard
                      {...song}
                      isCommentsOpen={openCommentsId === song.id}
                      onToggleComments={() => onToggleComments(song.id)}
                    />
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.button
                key={song.id}
                layout
                onClick={() => handleSelect(song.id)}
                className="w-full neo-card flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/[0.02] transition-colors text-left"
              >
                <span className={`text-2xl font-black tabular-nums w-7 text-center shrink-0 ${
                  rank <= 3 ? "text-primary" : "text-muted-foreground/60"
                }`}>
                  {rank}
                </span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle({ id: song.id, title: song.title, artist: song.artist, cover: song.cover });
                  }}
                  className="relative shrink-0 group cursor-pointer"
                  role="button"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  <img src={song.cover} alt={song.title} className="w-10 h-10 rounded-md object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{song.duration}</span>
                {isOwnProfile && (
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" aria-label="Reorder" />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty slots + Add button */}
      {isOwnProfile && remainingSlots > 0 && (
        <button
          onClick={onAddSong}
          className="neo-button w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Claim slot #{top.length + 1}</span>
          <span className="text-muted-foreground font-normal">· {remainingSlots} left</span>
        </button>
      )}

      {isOwnProfile && remainingSlots === 0 && (
        <button
          onClick={onAddSong}
          className="neo-button w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <span>Top 10 full — swap a song to add new</span>
        </button>
      )}
    </div>
  );
};

export default Top10List;
