import { useState } from "react";
import { useStoryReactions, REACTION_EMOJIS, tallyReactions } from "@/hooks/useStoryReactions";

interface Props {
  storyId: string;
  className?: string;
}

/**
 * Bottom-center emoji reaction bar shown to non-owner viewers. Tapping an
 * emoji upserts the viewer's single reaction; tapping the same emoji again
 * removes it. A short scale burst plays on tap for tactile feedback.
 */
const ReactionBar = ({ storyId, className }: Props) => {
  const { myEmoji, react, rows } = useStoryReactions(storyId, false);
  const [burst, setBurst] = useState<string | null>(null);
  const counts = tallyReactions(rows);

  const handleTap = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBurst(emoji);
    window.setTimeout(() => setBurst((b) => (b === emoji ? null : b)), 450);
    void react(emoji);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-2xl ${className ?? "bottom-4"}`}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const active = myEmoji === emoji;
        const count = counts[emoji] ?? 0;
        return (
          <button
            key={emoji}
            onClick={(e) => handleTap(emoji, e)}
            aria-label={`React with ${emoji}`}
            className={`relative flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-150 ${
              active ? "bg-white/25 scale-110" : "hover:bg-white/15"
            }`}
          >
            <span
              className={`text-lg leading-none transition-transform ${
                burst === emoji ? "animate-[reaction-burst_450ms_ease-out]" : ""
              }`}
            >
              {emoji}
            </span>
            {count > 0 && (
              <span className="text-[10px] font-bold text-white tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
      <style>{`
        @keyframes reaction-burst {
          0% { transform: scale(1); }
          40% { transform: scale(1.8) translateY(-4px); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ReactionBar;
