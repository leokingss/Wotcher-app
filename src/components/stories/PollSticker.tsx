import { useStoryPollVotes } from "@/hooks/useStoryPollVotes";
import type { PollSticker } from "@/lib/stickers";

interface PollRenderProps {
  sticker: PollSticker;
  /** Database story id this sticker lives on. When undefined (composer
   *  preview), votes are disabled and we only show a static preview. */
  storyId?: string;
  /** Hide voting affordance (e.g. own story author). */
  readOnly?: boolean;
}

/**
 * Two-option poll sticker with realtime vote tally. Tapping a side casts a
 * vote (or changes it). Once the user has voted, both bars reveal their share
 * of the total vs. the winning option highlighted in primary.
 */
const PollSticker = ({ sticker, storyId, readOnly }: PollRenderProps) => {
  const { tally, myVote, vote } = useStoryPollVotes(storyId, sticker.id);
  const counts = tally(2);
  const total = counts[0] + counts[1];
  const pct = (i: number) => (total === 0 ? 50 : Math.round((counts[i] / total) * 100));
  const hasVoted = myVote !== null && myVote !== undefined;

  const handleVote = (i: number) => {
    if (readOnly || !storyId) return;
    vote(i);
  };

  return (
    <div className="bg-background/85 backdrop-blur-md rounded-2xl p-3 shadow-2xl min-w-[200px] max-w-[260px] select-none">
      <p className="text-sm font-semibold text-center mb-2 line-clamp-2">{sticker.question}</p>
      <div className="flex gap-1.5">
        {sticker.options.map((opt, i) => {
          const won = total > 0 && counts[i] >= counts[1 - i] && counts[i] > 0;
          const mine = myVote === i;
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); handleVote(i); }}
              disabled={readOnly || !storyId}
              className={`relative flex-1 rounded-xl overflow-hidden text-xs font-bold py-2.5 transition-all ${
                mine ? "ring-2 ring-primary" : ""
              } ${readOnly ? "" : "hover:scale-[1.02] active:scale-95"}`}
            >
              {hasVoted && (
                <span
                  className={`absolute inset-y-0 left-0 ${won ? "bg-primary/80" : "bg-muted"} transition-all`}
                  style={{ width: `${pct(i)}%` }}
                />
              )}
              <span className="relative flex flex-col items-center gap-0.5">
                <span className="px-1">{opt}</span>
                {hasVoted && (
                  <span className="text-[10px] opacity-90 tabular-nums">{pct(i)}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-[10px] text-center text-muted-foreground mt-1.5 tabular-nums">
          {total} {total === 1 ? "vote" : "votes"}
        </p>
      )}
    </div>
  );
};

export default PollSticker;
