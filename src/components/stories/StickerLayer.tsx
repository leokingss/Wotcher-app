import { useRef, useState } from "react";
import { X, Music as MusicIcon, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sticker } from "@/lib/stickers";
import PollSticker from "./PollSticker";
import QuestionSticker from "./QuestionSticker";

interface StickerLayerProps {
  stickers: Sticker[];
  /** Editable mode: drag to move, tap × to remove. */
  editable?: boolean;
  onChange?: (next: Sticker[]) => void;
  /** Database story id (only meaningful in viewer mode for poll voting). */
  storyId?: string;
  /** Hide vote/interaction affordances on the author's own playback. */
  readOnly?: boolean;
}

/**
 * Renders sticker overlays absolutely positioned on top of the frame using
 * normalised x/y coordinates. In editable mode (composer) each sticker can be
 * dragged with pointer events; pointer movement is converted back into the
 * 0..1 coordinate space using the layer's bounding rect. The viewer mode is
 * static aside from interactive widgets like polls.
 */
const StickerLayer = ({ stickers, editable, onChange, storyId, readOnly }: StickerLayerProps) => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const updateSticker = (id: string, patch: Partial<Sticker>) => {
    if (!onChange) return;
    onChange(stickers.map((s) => (s.id === id ? ({ ...s, ...patch } as Sticker) : s)));
  };

  const removeSticker = (id: string) => {
    if (!onChange) return;
    onChange(stickers.filter((s) => s.id !== id));
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!editable) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (!editable || draggingId !== id || !layerRef.current) return;
    const rect = layerRef.current.getBoundingClientRect();
    const x = Math.min(0.95, Math.max(0.05, (e.clientX - rect.left) / rect.width));
    const y = Math.min(0.95, Math.max(0.05, (e.clientY - rect.top) / rect.height));
    updateSticker(id, { x, y } as any);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!editable) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDraggingId(null);
  };

  return (
    <div ref={layerRef} className="absolute inset-0 pointer-events-none">
      {stickers.map((s) => {
        const style: React.CSSProperties = {
          left: `${s.x * 100}%`,
          top: `${s.y * 100}%`,
          transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
        };
        return (
          <div
            key={s.id}
            className={cn(
              "absolute pointer-events-auto",
              editable && "cursor-grab",
              draggingId === s.id && "cursor-grabbing",
            )}
            style={style}
            onPointerDown={(e) => handlePointerDown(e, s.id)}
            onPointerMove={(e) => handlePointerMove(e, s.id)}
            onPointerUp={handlePointerUp}
          >
            {editable && (
              <button
                onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg z-10"
                aria-label="Remove sticker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <StickerContent sticker={s} storyId={storyId} readOnly={readOnly || editable} />
          </div>
        );
      })}
    </div>
  );
};

const StickerContent = ({
  sticker,
  storyId,
  readOnly,
}: {
  sticker: Sticker;
  storyId?: string;
  readOnly?: boolean;
}) => {
  switch (sticker.type) {
    case "poll":
      return <PollSticker sticker={sticker} storyId={storyId} readOnly={readOnly} />;
    case "question":
      return <QuestionSticker sticker={sticker} storyId={storyId} readOnly={readOnly} />;
    case "music":
      return (
        <div className="flex items-center gap-2 bg-background/85 backdrop-blur-md rounded-full pl-1 pr-3 py-1 shadow-2xl max-w-[240px]">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
            {sticker.coverUrl ? (
              <img src={sticker.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MusicIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{sticker.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{sticker.artist}</p>
          </div>
        </div>
      );
    case "emoji":
      return <span className="text-5xl drop-shadow-2xl">{sticker.emoji}</span>;
    case "mention":
      return (
        <div className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-2xl text-sm font-bold">
          <AtSign className="w-3.5 h-3.5" />
          {sticker.username}
        </div>
      );
  }
};

export default StickerLayer;
