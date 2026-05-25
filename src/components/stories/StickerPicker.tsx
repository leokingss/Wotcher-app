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
  const [tab, setTab] = useState<"home" | "poll" | "question" | "music" | "emoji" | "mention" | "text">("home");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollA, setPollA] = useState("Yes");
  const [pollB, setPollB] = useState("No");
  const [questionText, setQuestionText] = useState("");
  const [mentionHandle, setMentionHandle] = useState("");
  const [textValue, setTextValue] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textBg, setTextBg] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState<"plain" | "filled" | "outline" | "neon">("plain");
  const [textFont, setTextFont] = useState<"display" | "serif" | "mono">("display");

  const reset = () => {
    setTab("home");
    setPollQuestion("");
    setPollA("Yes");
    setPollB("No");
    setQuestionText("");
    setMentionHandle("");
    setTextValue("");
    setTextColor("#ffffff");
    setTextBg(null);
    setTextStyle("plain");
    setTextFont("display");
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
            {tab === "home" ? "Add sticker" : tab === "poll" ? "Poll" : tab === "question" ? "Question" : tab === "music" ? "Music" : tab === "emoji" ? "Emoji" : tab === "text" ? "Text" : "Mention"}
          </SheetTitle>
        </SheetHeader>

        {tab === "home" && (
          <div className="grid grid-cols-3 gap-2 pb-4">
            <button onClick={() => setTab("text")} className="neo-button-icon flex flex-col items-center gap-2 p-4 rounded-xl">
              <TypeIcon className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold">Text</span>
            </button>
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

        {tab === "text" && (() => {
          const COLORS = ["#ffffff", "#000000", "#ffd700", "#ff3b30", "#34c759", "#0a84ff", "#ff2d92", "#a78bfa"];
          const STYLES: { id: "plain" | "filled" | "outline" | "neon"; label: string }[] = [
            { id: "plain", label: "Plain" },
            { id: "filled", label: "Filled" },
            { id: "outline", label: "Outline" },
            { id: "neon", label: "Neon" },
          ];
          const FONTS: { id: "display" | "serif" | "mono"; label: string; family: string }[] = [
            { id: "display", label: "Display", family: "ui-sans-serif, system-ui, -apple-system, 'Avenir Next', Avenir, sans-serif" },
            { id: "serif", label: "Serif", family: "ui-serif, 'Cormorant Garamond', Georgia, serif" },
            { id: "mono", label: "Mono", family: "ui-monospace, 'JetBrains Mono', Menlo, monospace" },
          ];
          const previewStyle: React.CSSProperties = {
            fontFamily: FONTS.find((f) => f.id === textFont)!.family,
            fontWeight: 800,
            color: textStyle === "outline" ? "transparent" : textColor,
            WebkitTextStroke: textStyle === "outline" ? `2px ${textColor}` : undefined,
            textShadow:
              textStyle === "neon"
                ? `0 0 8px ${textColor}, 0 0 16px ${textColor}, 0 0 24px ${textColor}`
                : textStyle === "plain"
                ? "0 2px 12px rgba(0,0,0,0.45)"
                : undefined,
            background: textStyle === "filled" ? (textBg ?? "rgba(0,0,0,0.55)") : "transparent",
            padding: textStyle === "filled" ? "0.4em 0.7em" : 0,
            borderRadius: textStyle === "filled" ? "0.6em" : 0,
          };
          return (
            <div className="space-y-3 pb-4">
              <div className="neo-card-inset rounded-xl p-6 min-h-[120px] flex items-center justify-center bg-[linear-gradient(135deg,#333,#111)]">
                <span style={{ ...previewStyle, fontSize: 28, lineHeight: 1.1, textAlign: "center" }}>
                  {textValue || "Your text"}
                </span>
              </div>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value.slice(0, 120))}
                placeholder="Type something…"
                rows={2}
                className="w-full neo-card-inset rounded-xl px-4 py-3 bg-transparent outline-none resize-none"
              />
              <div className="flex items-center gap-2 overflow-x-auto">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-7 h-7 rounded-full flex-shrink-0 ring-2 transition-all ${textColor === c ? "ring-primary scale-110" : "ring-border"}`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTextStyle(s.id)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${textStyle === s.id ? "bg-primary text-primary-foreground" : "neo-button-icon"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTextFont(f.id)}
                    style={{ fontFamily: f.family }}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${textFont === f.id ? "bg-primary text-primary-foreground" : "neo-button-icon"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                disabled={!textValue.trim()}
                onClick={() => finish({
                  id: newStickerId(),
                  type: "text",
                  text: textValue.trim(),
                  color: textColor,
                  bg: textStyle === "filled" ? (textBg ?? "rgba(0,0,0,0.55)") : null,
                  style: textStyle,
                  font: textFont,
                  ...DEFAULT_STICKER_POS,
                })}
                className="action-button action-button-primary w-full disabled:opacity-50"
              >
                Add text
              </button>
            </div>
          );
        })()}



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
