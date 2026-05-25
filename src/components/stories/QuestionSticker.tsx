import { useState } from "react";
import { MessageCircleQuestion, Send, Check } from "lucide-react";
import type { QuestionSticker as QuestionStickerType } from "@/lib/stickers";
import { sendQuestionReply } from "@/hooks/useStoryQuestionReplies";
import { toast } from "sonner";

interface Props {
  sticker: QuestionStickerType;
  storyId?: string;
  /** When true, this is the author's own playback or composer preview. */
  readOnly?: boolean;
}

/**
 * Question sticker rendered inside the story viewer. In viewer mode (readOnly
 * = false) tapping the "Reply…" pill expands an inline composer that posts a
 * row into `story_question_replies`. The composer keeps its own local
 * "submitted" state so the same viewer sees confirmation, but they can post
 * additional replies if they wish.
 */
const QuestionSticker = ({ sticker, storyId, readOnly }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!storyId) {
      toast.error("Story not ready yet");
      return;
    }
    setSending(true);
    const res = await sendQuestionReply(storyId, sticker.id, text);
    setSending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not send reply");
      return;
    }
    setText("");
    setSent(true);
    setOpen(false);
    toast.success("Reply sent");
  };

  return (
    <div className="bg-background/85 backdrop-blur-md rounded-2xl p-3 shadow-2xl min-w-[220px] max-w-[280px]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
        <MessageCircleQuestion className="w-3 h-3" /> Question
      </div>
      <p className="text-sm font-semibold mb-2 line-clamp-3">{sticker.prompt}</p>

      {readOnly ? (
        <div className="text-xs text-muted-foreground italic px-2 py-1.5 rounded-lg bg-muted/40">
          Replies appear in your inbox
        </div>
      ) : open ? (
        <form onSubmit={submit} className="flex items-center gap-1.5">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Type a reply…"
            maxLength={500}
            className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg bg-muted/60 outline-none border border-border focus:border-primary"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-7 h-7 flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            aria-label="Send reply"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full text-left text-xs px-2 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors flex items-center gap-1.5"
        >
          {sent ? (
            <>
              <Check className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground italic">Reply sent — tap to send another</span>
            </>
          ) : (
            <span className="text-muted-foreground italic">Reply…</span>
          )}
        </button>
      )}
    </div>
  );
};

export default QuestionSticker;
