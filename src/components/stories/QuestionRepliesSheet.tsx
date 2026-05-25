import { MessageCircleQuestion, X } from "lucide-react";
import { useStoryQuestionReplies, groupRepliesBySticker } from "@/hooks/useStoryQuestionReplies";
import type { QuestionSticker } from "@/lib/stickers";

const AVATAR_FALLBACK = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;

interface Props {
  storyId: string;
  questions: QuestionSticker[];
  open: boolean;
  onClose: () => void;
}

/**
 * Owner-only bottom sheet that lists all replies received on each question
 * sticker on the current frame. Subscribes to realtime so new replies appear
 * live while the owner has the sheet open.
 */
const QuestionRepliesSheet = ({ storyId, questions, open, onClose }: Props) => {
  const { replies, loading } = useStoryQuestionReplies(storyId, open);
  if (!open) return null;
  const grouped = groupRepliesBySticker(replies);
  const total = replies.length;

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-h-[70%] bg-background rounded-t-3xl p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3" />
        <div className="flex items-center gap-2 mb-4">
          <MessageCircleQuestion className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold flex-1">
            {total} {total === 1 ? "reply" : "replies"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
            aria-label="Close replies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No question stickers on this frame.
          </p>
        ) : (
          <div className="space-y-5 pb-2">
            {questions.map((q) => {
              const list = grouped[q.id] ?? [];
              return (
                <section key={q.id}>
                  <div className="mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      Question
                    </p>
                    <p className="text-sm font-semibold">{q.prompt}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {list.length} {list.length === 1 ? "reply" : "replies"}
                    </p>
                  </div>
                  {loading && list.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">Loading…</p>
                  ) : list.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No replies yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((r) => {
                        const name = r.author?.display_name || r.author?.username || "Someone";
                        return (
                          <li key={r.id} className="flex items-start gap-3 p-2 rounded-xl bg-muted/40">
                            <img
                              src={r.author?.avatar_url || AVATAR_FALLBACK(name)}
                              alt={name}
                              className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-muted"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <p className="text-xs font-semibold truncate">{name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(r.created_at).toLocaleString(undefined, {
                                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">{r.text}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionRepliesSheet;
