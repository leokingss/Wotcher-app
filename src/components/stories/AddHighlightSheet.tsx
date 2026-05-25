import { useEffect, useState } from "react";
import { X, Check, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStoryHighlights } from "@/hooks/useStoryHighlights";
import { toast } from "sonner";
import type { StoryFrameRow } from "@/hooks/useStories";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When provided, "Add to existing" mode shows the list of user highlights. */
  preselectedHighlightId?: string;
}

/**
 * Sheet for the profile owner to gather their currently active stories
 * (still within the 24h window) and pin them to a new or existing
 * highlight collection.
 */
const AddHighlightSheet = ({ open, onOpenChange, preselectedHighlightId }: Props) => {
  const { user } = useAuth();
  const { highlights, createHighlight, addItemsToHighlight } = useStoryHighlights(user?.id);
  const [active, setActive] = useState<StoryFrameRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState<string>(preselectedHighlightId ?? "__new__");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setSelected(new Set());
    setTitle("");
    setTarget(preselectedHighlightId ?? "__new__");
    (async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      setActive((data ?? []) as any);
    })();
  }, [open, user, preselectedHighlightId]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    if (selected.size === 0) {
      toast.error("Pick at least one frame");
      return;
    }
    if (target === "__new__" && !title.trim()) {
      toast.error("Name your highlight");
      return;
    }
    const items = active
      .filter((f) => selected.has(f.id))
      .map((f) => ({
        original_story_id: f.id,
        media_type: f.media_type,
        media_url: f.media_url,
        caption: f.caption,
        track_title: f.track_title,
        track_artist: f.track_artist,
        filter_id: f.filter_id,
        filter_intensity: f.filter_intensity,
        stickers: (f.stickers ?? []) as any,
      }));
    setBusy(true);
    try {
      if (target === "__new__") {
        await createHighlight(title.trim(), items);
        toast.success("Highlight created");
      } else {
        await addItemsToHighlight(target, items);
        toast.success("Added to highlight");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="w-full md:max-w-md bg-background neo-card rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">New Highlight</h3>
          <button onClick={() => onOpenChange(false)} className="neo-button-icon w-9 h-9 rounded-full flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target selector */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Save to</label>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setTarget("__new__")}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${target === "__new__" ? "bg-primary text-primary-foreground" : "neo-button"}`}
            >
              + New
            </button>
            {highlights.map((h) => (
              <button
                key={h.id}
                onClick={() => setTarget(h.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${target === h.id ? "bg-primary text-primary-foreground" : "neo-button"}`}
              >
                {h.title}
              </button>
            ))}
          </div>
          {target === "__new__" && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Highlight name"
              maxLength={40}
              className="neo-card-inset w-full px-4 py-2.5 rounded-xl text-sm bg-transparent focus:outline-none"
            />
          )}
        </div>

        {/* Active stories grid */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pick frames from your last 24h</label>
          {active.length === 0 ? (
            <div className="neo-card-inset rounded-2xl p-6 text-center text-sm text-muted-foreground">
              <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No active stories. Post one first to add it to a highlight.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {active.map((f) => {
                const sel = selected.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    className={`relative aspect-[9/16] rounded-xl overflow-hidden ring-2 transition-all ${sel ? "ring-primary scale-[0.97]" : "ring-transparent"}`}
                  >
                    <img src={f.media_url} alt="" className="w-full h-full object-cover" />
                    {sel && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={busy || selected.size === 0}
          className="w-full action-button action-button-primary disabled:opacity-50"
        >
          {busy ? "Saving..." : `Save ${selected.size || ""} ${selected.size === 1 ? "frame" : "frames"}`.trim()}
        </button>
      </div>
    </div>
  );
};

export default AddHighlightSheet;
