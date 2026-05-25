import { Heart, X } from "lucide-react";
import { useStoryReactions, REACTION_EMOJIS, tallyReactions } from "@/hooks/useStoryReactions";

const AVATAR_FALLBACK = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;

interface Props {
  storyId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Owner-only sheet that shows reaction counts per emoji and the list of
 * reactors. Subscribes via `useStoryReactions(storyId, true)` so the panel
 * updates live while open.
 */
const ReactionsSheet = ({ storyId, open, onClose }: Props) => {
  const { rows, loading } = useStoryReactions(open ? storyId : undefined, true);
  if (!open) return null;

  const counts = tallyReactions(rows);
  const total = rows.length;
  const emojis = REACTION_EMOJIS.filter((e) => counts[e]);
  const otherEmojis = Array.from(new Set(rows.map((r) => r.emoji))).filter(
    (e) => !REACTION_EMOJIS.includes(e as any),
  );
  const orderedEmojis = [...emojis, ...otherEmojis];

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-h-[70%] bg-background rounded-t-3xl p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3" />
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold flex-1">
            {total} {total === 1 ? "reaction" : "reactions"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
            aria-label="Close reactions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No reactions yet.
          </p>
        ) : (
          <>
            {/* Aggregate row of emoji counts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {orderedEmojis.map((e) => (
                <div
                  key={e}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-semibold"
                >
                  <span className="text-base leading-none">{e}</span>
                  <span className="tabular-nums">{counts[e]}</span>
                </div>
              ))}
            </div>

            {/* Reactor list */}
            <ul className="space-y-2 pb-2">
              {rows.map((r) => {
                const name = r.author?.display_name || r.author?.username || "Someone";
                return (
                  <li key={r.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                    <img
                      src={r.author?.avatar_url || AVATAR_FALLBACK(name)}
                      alt={name}
                      className="w-9 h-9 rounded-full flex-shrink-0 object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-2xl">{r.emoji}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ReactionsSheet;
