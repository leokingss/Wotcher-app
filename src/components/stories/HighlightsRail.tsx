import { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useStoryHighlights, type StoryHighlight } from "@/hooks/useStoryHighlights";
import HighlightViewer from "./HighlightViewer";
import AddHighlightSheet from "./AddHighlightSheet";
import { toast } from "sonner";

interface Props {
  /** Profile being viewed (may be the signed-in user or another). */
  userId: string | null | undefined;
  isOwner?: boolean;
}

const HighlightsRail = ({ userId, isOwner }: Props) => {
  const { highlights, loading, deleteHighlight, renameHighlight, removeItem } = useStoryHighlights(userId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  if (loading) return null;
  if (!isOwner && highlights.length === 0) return null;

  const active: StoryHighlight | null = highlights.find((h) => h.id === openId) ?? null;

  const handleRename = async (h: StoryHighlight) => {
    const next = prompt("Rename highlight", h.title);
    if (!next || !next.trim() || next === h.title) return;
    try {
      await renameHighlight(h.id, next.trim());
      toast.success("Renamed");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleDelete = async (h: StoryHighlight) => {
    if (!confirm(`Delete "${h.title}" highlight?`)) return;
    try {
      await deleteHighlight(h.id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 py-2">
          {isOwner && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="neo-button-icon w-16 h-16 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">New</span>
            </button>
          )}
          {highlights.map((h) => (
            <div key={h.id} className="relative flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setOpenId(h.id)}
                className="neo-button-icon w-16 h-16 rounded-full p-[2px] overflow-hidden active:scale-95 transition-transform"
                aria-label={`Open ${h.title}`}
              >
                {h.cover_url ? (
                  <img src={h.cover_url} alt={h.title} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted" />
                )}
              </button>
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuId(menuId === h.id ? null : h.id); }}
                  className="absolute top-0 right-0 w-5 h-5 rounded-full bg-background neo-button-icon flex items-center justify-center"
                  aria-label="Options"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              )}
              <span className="text-[11px] font-medium text-foreground max-w-[64px] truncate">{h.title}</span>

              {menuId === h.id && (
                <div className="absolute z-30 top-6 right-0 neo-card rounded-xl py-1 min-w-[140px] bg-background shadow-lg">
                  <button
                    onClick={() => { setMenuId(null); handleRename(h); }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted/50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => { setMenuId(null); handleDelete(h); }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted/50 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <HighlightViewer
        highlight={active}
        open={!!active}
        onClose={() => setOpenId(null)}
        isOwner={isOwner}
        onRemoveItem={(itemId) => removeItem(itemId)}
      />

      {isOwner && <AddHighlightSheet open={addOpen} onOpenChange={setAddOpen} />}
    </>
  );
};

export default HighlightsRail;
