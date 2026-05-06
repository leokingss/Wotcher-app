import { Plus, Play, Pause, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import SongCard from "./SongCard";
import { PlaylistItem } from "@/data/mockProfile";
import { usePlayer } from "@/hooks/usePlayer";

interface Top10ListProps {
  songs: PlaylistItem[];
  openCommentsId: number | null;
  onToggleComments: (id: number) => void;
  onAddSong?: () => void;
  isOwnProfile?: boolean;
}

const Top10List = ({ songs, openCommentsId, onToggleComments, onAddSong, isOwnProfile = true }: Top10ListProps) => {
  const top = songs.slice(0, 10);
  const number1 = top[0];
  const rest = top.slice(1);
  const remainingSlots = 10 - top.length;
  const { playingId, toggle } = usePlayer();

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="neo-card p-4 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Personal Chart</p>
          <h3 className="text-lg font-bold mt-0.5">My Top 10</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{top.length}/10 slots filled</p>
        </div>
        <div className="flex items-end gap-0.5 h-10" aria-hidden>
          {[40, 65, 90, 55, 75, 45, 80].map((h, i) => (
            <motion.span
              key={i}
              className="w-1 bg-primary rounded-full"
              animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* #1 Hero */}
      {number1 && (
        <div className="relative">
          <div className="absolute -top-2 -left-2 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center neo-card shadow-lg">
            <span className="text-primary-foreground font-black text-lg leading-none">1</span>
          </div>
          <div className="ring-2 ring-primary/40 rounded-xl">
            <SongCard
              {...number1}
              isCommentsOpen={openCommentsId === number1.id}
              onToggleComments={() => onToggleComments(number1.id)}
            />
          </div>
        </div>
      )}

      {/* #2-10 Compact ranked rows */}
      {rest.length > 0 && (
        <div className="neo-card rounded-xl overflow-hidden divide-y divide-border/40">
          {rest.map((song, idx) => {
            const rank = idx + 2;
            const isPlaying = playingId === song.id;
            return (
              <div
                key={song.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors"
              >
                <span className={`text-2xl font-black tabular-nums w-7 text-center ${
                  rank <= 3 ? "text-primary" : "text-muted-foreground/60"
                }`}>
                  {rank}
                </span>
                <button
                  onClick={() => toggle({ id: song.id, title: song.title, artist: song.artist, cover: song.cover })}
                  className="relative shrink-0 group"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  <img src={song.cover} alt={song.title} className="w-10 h-10 rounded-md object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{song.duration}</span>
                {isOwnProfile && (
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" aria-label="Reorder" />
                )}
              </div>
            );
          })}
        </div>
      )}

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
