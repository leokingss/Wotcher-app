import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Track } from "@/data/mockCharts";

interface Props {
  open: boolean;
  initial: Track[];
  onClose: () => void;
  onSave: (orderedIds: string[]) => void;
}

const SortableItem = ({ track, rank }: { track: Track; rank: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="neo-card flex items-center gap-3 px-3 py-2.5 rounded-xl touch-none cursor-grab active:cursor-grabbing"
    >
      <span className={`text-xl font-black tabular-nums w-6 text-center shrink-0 ${rank === 1 ? "text-primary" : "text-muted-foreground/70"}`}>
        {rank}
      </span>
      <img src={track.artwork} alt={track.title} className="w-10 h-10 rounded-md object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground/60 shrink-0" />
    </div>
  );
};

const ReRankSheet = ({ open, initial, onClose, onSave }: Props) => {
  const [items, setItems] = useState<Track[]>(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((curr) => {
      const oldIdx = curr.findIndex((t) => t.id === active.id);
      const newIdx = curr.findIndex((t) => t.id === over.id);
      return arrayMove(curr, oldIdx, newIdx);
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-background neo-card rounded-t-3xl sm:rounded-3xl p-4 max-h-[88vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold">Re-rank your Top 10</h3>
            <p className="text-xs text-muted-foreground">Drag to reorder. Save to lock in this week.</p>
          </div>
          <button onClick={onClose} className="neo-button-icon w-9 h-9 rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {items.map((t, i) => (
                <SortableItem key={t.id} track={t} rank={i + 1} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="neo-button flex-1 py-3 rounded-xl text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => onSave(items.map((t) => t.id))}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Save order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReRankSheet;
