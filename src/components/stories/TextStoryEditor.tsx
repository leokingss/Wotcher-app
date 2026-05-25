import { useEffect, useRef, useState } from "react";
import { Type, Palette } from "lucide-react";

const GRADIENTS = [
  "linear-gradient(135deg, hsl(45,100%,55%), hsl(15,100%,55%))",
  "linear-gradient(135deg, hsl(210,80%,55%), hsl(280,70%,55%))",
  "linear-gradient(135deg, hsl(160,70%,45%), hsl(190,80%,50%))",
  "linear-gradient(135deg, hsl(340,80%,55%), hsl(20,90%,55%))",
  "linear-gradient(135deg, #111, #333)",
  "linear-gradient(135deg, #f5f3ee, #d4d0c4)",
];

const FONTS = [
  { label: "Display", value: "ui-sans-serif, system-ui, -apple-system, 'Avenir Next', Avenir, sans-serif", weight: 800 },
  { label: "Serif", value: "ui-serif, 'Cormorant Garamond', Georgia, serif", weight: 600 },
  { label: "Mono", value: "ui-monospace, 'JetBrains Mono', 'Menlo', monospace", weight: 600 },
];

interface Props {
  /** Called with a generated jpg blob + a preview URL when the user taps Done. */
  onDone: (blob: Blob, previewUrl: string) => void;
}

const W = 1080;
const H = 1920;

/** Premium text-only story card: pick gradient + font, type text, render to canvas. */
const TextStoryEditor = ({ onDone }: Props) => {
  const [text, setText] = useState("");
  const [bgIdx, setBgIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render preview into hidden canvas whenever inputs change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Parse gradient stops manually so canvas can draw them.
    const g = ctx.createLinearGradient(0, 0, W, H);
    const stops = GRADIENTS[bgIdx];
    // crude parse: extract first two colors
    const colors = stops.match(/(#[0-9a-fA-F]{3,8}|hsl\([^)]+\)|rgb[a]?\([^)]+\))/g) ?? ["#222", "#000"];
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1] ?? colors[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (text.trim()) {
      const f = FONTS[fontIdx];
      // word-wrap helper
      const lines: string[] = [];
      const words = text.split(/\s+/);
      const max = Math.max(8, Math.min(20, Math.ceil(text.length / 6)));
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > max) {
          if (line) lines.push(line.trim());
          line = w;
        } else line = (line + " " + w).trim();
      }
      if (line) lines.push(line);

      const fontSize = Math.min(180, Math.max(80, Math.floor(900 / Math.max(lines.length, 1))));
      ctx.font = `${f.weight} ${fontSize}px ${f.value}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = bgIdx === 5 ? "#111" : "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 24;
      const lineH = fontSize * 1.15;
      const startY = H / 2 - ((lines.length - 1) * lineH) / 2;
      lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineH));
    }
  }, [text, bgIdx, fontIdx]);

  const handleDone = () => {
    const c = canvasRef.current;
    if (!c || !text.trim()) return;
    setBusy(true);
    c.toBlob(
      (blob) => {
        if (!blob) { setBusy(false); return; }
        onDone(blob, URL.createObjectURL(blob));
        setBusy(false);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="space-y-3">
      <div
        className="relative w-full aspect-[9/14] rounded-2xl overflow-hidden flex items-center justify-center p-6"
        style={{ background: GRADIENTS[bgIdx] }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 240))}
          placeholder="Type something…"
          rows={4}
          className="w-full bg-transparent text-center outline-none resize-none placeholder:text-white/60"
          style={{
            color: bgIdx === 5 ? "#111" : "#fff",
            fontFamily: FONTS[fontIdx].value,
            fontWeight: FONTS[fontIdx].weight as any,
            fontSize: "clamp(20px, 6vw, 36px)",
            lineHeight: 1.15,
            textShadow: bgIdx === 5 ? "none" : "0 2px 12px rgba(0,0,0,0.25)",
          }}
        />
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-bold text-white/70 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full">
          {text.length}/240
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          {GRADIENTS.map((g, i) => (
            <button
              key={i}
              onClick={() => setBgIdx(i)}
              className={`w-7 h-7 rounded-full ring-2 transition-all ${
                bgIdx === i ? "ring-primary scale-110" : "ring-transparent"
              }`}
              style={{ background: g }}
              aria-label={`Background ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Type className="w-4 h-4 text-muted-foreground mr-1" />
          {FONTS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setFontIdx(i)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                fontIdx === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleDone}
        disabled={!text.trim() || busy}
        className="action-button action-button-primary w-full disabled:opacity-50"
      >
        {busy ? "Rendering…" : "Use this card"}
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default TextStoryEditor;
