import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Pause } from "lucide-react";
import WaveProgress from "@/components/WaveProgress";
import { getFilterById, cssFilterAt, overlayStrength } from "@/lib/storyFilters";
import StickerLayer from "./StickerLayer";
import type { StoryHighlight } from "@/hooks/useStoryHighlights";

const FRAME_DURATION_MS = 5000;

interface Props {
  highlight: StoryHighlight | null;
  open: boolean;
  onClose: () => void;
  isOwner?: boolean;
  onRemoveItem?: (itemId: string) => void;
}

const HighlightViewer = ({ highlight, open, onClose, isOwner, onRemoveItem }: Props) => {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const accumRef = useRef(0);

  const items = highlight?.items ?? [];
  const item = items[idx];

  const goNext = useCallback(() => {
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1);
      setProgress(0);
      accumRef.current = 0;
    } else {
      onClose();
    }
  }, [idx, items.length, onClose]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setProgress(0);
      accumRef.current = 0;
    } else {
      setProgress(0);
      accumRef.current = 0;
    }
  }, [idx]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setProgress(0);
    accumRef.current = 0;
    setPaused(false);
  }, [open, highlight?.id]);

  useEffect(() => {
    if (!open || paused || !item) return;
    startedAtRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = accumRef.current + (now - startedAtRef.current);
      const pct = Math.min(1, elapsed / FRAME_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        accumRef.current = 0;
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      accumRef.current += performance.now() - startedAtRef.current;
    };
  }, [open, paused, item, goNext, idx]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") { accumRef.current = 0; goNext(); }
      else if (e.key === "ArrowLeft") { accumRef.current = 0; goPrev(); }
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goNext, goPrev, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !highlight || !item) return null;

  const preset = getFilterById(item.filter_id);
  const intensity = item.filter_intensity ?? 100;
  const t = overlayStrength(intensity);
  const filterStyle = { filter: cssFilterAt(preset, intensity) } as const;
  const isVideo = /^.*\.(mp4|webm|mov|m4v)(\?|$)/i.test(item.media_url);

  const handleRemove = () => {
    if (!onRemoveItem) return;
    if (!confirm("Remove this frame from the highlight?")) return;
    onRemoveItem(item.id);
    if (items.length === 1) onClose();
    else if (idx >= items.length - 1) setIdx(Math.max(0, idx - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" role="dialog" aria-modal>
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden md:rounded-[2rem] md:my-6 md:max-h-[92vh] md:shadow-[12px_12px_32px_rgba(0,0,0,0.55),-8px_-8px_24px_rgba(255,255,255,0.04)] md:ring-1 md:ring-white/5">
        {isVideo ? (
          <video key={item.id} src={item.media_url} className="absolute inset-0 w-full h-full object-cover" style={filterStyle} autoPlay muted playsInline loop />
        ) : (
          <img key={item.id} src={item.media_url} alt={item.caption ?? highlight.title} className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-200" style={filterStyle} draggable={false} />
        )}
        {preset.tint && (
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: preset.tint.color, opacity: preset.tint.opacity * t, mixBlendMode: preset.tint.blend ?? "soft-light" }} />
        )}
        {preset.vignette && (
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 ${80 + preset.vignette * t * 120}px ${20 + preset.vignette * t * 80}px rgba(0,0,0,${preset.vignette * t * 0.85})` }} />
        )}

        <StickerLayer stickers={item.stickers ?? []} readOnly />

        {/* Progress segments */}
        <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 flex gap-1">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/20">
              <WaveProgress progress={i < idx ? 1 : i === idx ? progress : 0} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-7 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold truncate max-w-[180px]">{highlight.title}</div>
            {paused && <Pause className="w-3.5 h-3.5 opacity-70" />}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button onClick={handleRemove} aria-label="Remove from highlight" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Caption */}
        {item.caption && (
          <div className="absolute bottom-6 left-0 right-0 px-6 z-10 text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">{item.caption}</p>
          </div>
        )}

        {/* Click zones */}
        <button onClick={() => { accumRef.current = 0; goPrev(); }} className="absolute left-0 top-12 bottom-0 w-1/3 z-10" aria-label="Previous">
          <ChevronLeft className="w-7 h-7 text-white/0 group-hover:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
        </button>
        <button onClick={() => { accumRef.current = 0; goNext(); }} className="absolute right-0 top-12 bottom-0 w-1/3 z-10" aria-label="Next">
          <ChevronRight className="w-7 h-7 text-white/0 group-hover:text-white/40 absolute right-3 top-1/2 -translate-y-1/2" />
        </button>
        <button onClick={() => setPaused((p) => !p)} className="absolute left-1/3 right-1/3 top-12 bottom-0 z-10" aria-label="Pause" />
      </div>
    </div>
  );
};

export default HighlightViewer;
