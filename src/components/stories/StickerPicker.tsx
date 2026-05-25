import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart3, MessageCircleQuestion, Music as MusicIcon, Smile, AtSign, X, Plus, Type as TypeIcon } from "lucide-react";
import {
  DEFAULT_STICKER_POS,
  newStickerId,
  type Sticker,
} from "@/lib/stickers";
import MusicPicker from "./MusicPicker";

interface StickerPickerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (sticker: Sticker) => void;
}

const QUICK_EMOJIS = ["❤️", "🔥", "✨", "😂", "😍", "💀", "🎉", "👀", "🌟", "💯", "🥹", "🤘", "👏", "🎵", "☀️", "🌙"];

/**
 * Bottom-sheet picker that scaffolds a new sticker for the active frame. The
 * actual placement / drag is handled by `StickerLayer` once the sticker is
 * in `frame.stickers`.
 */
const StickerPicker = ({ open, onClose, onAdd }: StickerPickerProps) => {
  const [tab, setTab] = useState<"home" | "poll" | "question" | "music" | "emoji" | "mention">("home");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollA, setPollA] = useState("Yes");
  const [pollB, setPollB] = useState("No");
  const [questionText, setQuestionText] = useState("");
  const [mentionHandle, setMentionHandle] = useState("");

  const reset = () => {
    setTab("home");
    setPollQuestion("");
    setPollA("Yes");
    setPollB("No");
    setQuestionText("");
    setMentionHandle("");
  };

  const finish = (s: Sticker) => {
    onAdd(s);
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-3">
          <SheetTitle className="text-left">
            {tab === "home" ? "Add sticker" : tab === "poll" ? "Poll" : tab === "question" ? "Question" : tab === "music" ? "Music" : tab === "emoji" ? "Emoji" : "Mention"}
          </SheetTitle>
        </SheetHeader>

        {tab === "home" && (
          <div className="grid grid-cols-3 gap-2 pb-4">
            <button onClick={() => setTab("poll")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <BarChart3 className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Poll</span>
            </button>
            <button onClick={() => setTab("question")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <MessageCircleQuestion className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Question</span>
            </button>
            <button onClick={() => setTab("music")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <MusicIcon className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Music</span>
            </button>
            <button onClick={() => setTab("emoji")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <Smile className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Emoji</span>
            </button>
            <button onClick={() => setTab("mention")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <AtSign className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Mention</span>
            </button>
          </div>
        )}

        {tab === "poll" && (
          <div className="space-y-3 pb-4">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask something…"
              maxLength={80}
              className="w-full neo-card-inset rounded-xl px-4 py-3 bg-transparent outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={pollA}
                onChange={(e) => setPollA(e.target.value)}
                maxLength={20}
                className="neo-card-inset rounded-xl px-4 py-3 bg-transparent outline-none text-center font-semibold"
              />
              <input
                value={pollB}
                onChange={(e) => setPollB(e.target.value)}
                maxLength={20}
                className="neo-card-inset rounded-xl px-4 py-3 bg-transparent outline-none text-center font-semibold"
              />
            </div>
            <button
              disabled={!pollQuestion.trim() || !pollA.trim() || !pollB.trim()}
              onClick={() => finish({
                id: newStickerId(),
                type: "poll",
                question: pollQuestion.trim(),
                options: [pollA.trim(), pollB.trim()],
                ...DEFAULT_STICKER_POS,
              })}
              className="action-button action-button-primary w-full disabled:opacity-50"
            >
              Add poll
            </button>
          </div>
        )}

        {tab === "question" && (
          <div className="space-y-3 pb-4">
            <input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ask me anything…"
              maxLength={80}
              className="w-full neo-card-inset rounded-xl px-4 py-3 bg-transparent outline-none"
            />
            <button
              disabled={!questionText.trim()}
              onClick={() => finish({
                id: newStickerId(),
                type: "question",
                prompt: questionText.trim(),
                ...DEFAULT_STICKER_POS,
              })}
              className="action-button action-button-primary w-full disabled:opacity-50"
            >
              Add question
            </button>
          </div>
        )}

        {tab === "music" && (
          <MusicPicker onPick={(t) => finish({
            id: newStickerId(),
            type: "music",
            title: t.title,
            artist: t.artist,
            coverUrl: t.coverUrl,
            previewUrl: t.previewUrl,
            ...DEFAULT_STICKER_POS,
          })} />
        )}

        {tab === "emoji" && (
          <div className="grid grid-cols-8 gap-2 pb-4">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => finish({
                  id: newStickerId(),
                  type: "emoji",
                  emoji: e,
                  ...DEFAULT_STICKER_POS,
                })}
                className="neo-button-icon aspect-square text-2xl flex items-center justify-center rounded-xl hover:scale-110 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {tab === "mention" && (
          <div className="space-y-3 pb-4">
            <div className="flex items-center neo-card-inset rounded-xl px-4 py-3">
              <AtSign className="w-4 h-4 text-muted-foreground mr-1" />
              <input
                value={mentionHandle}
                onChange={(e) => setMentionHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="username"
                maxLength={30}
                className="flex-1 bg-transparent outline-none"
              />
            </div>
            <button
              disabled={!mentionHandle.trim()}
              onClick={() => finish({
                id: newStickerId(),
                type: "mention",
                username: mentionHandle.trim(),
                ...DEFAULT_STICKER_POS,
              })}
              className="action-button action-button-primary w-full disabled:opacity-50"
            >
              Add mention
            </button>
          </div>
        )}

        {tab !== "home" && (
          <button
            onClick={() => setTab("home")}
            className="w-full text-xs text-muted-foreground py-2 hover:text-foreground"
          >
            ← Back
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default StickerPicker;
