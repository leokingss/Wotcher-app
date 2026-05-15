import { useEffect, useRef, useState } from "react";
import { X, Image as ImageIcon, Film, Music, Camera, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { StoryFrame, StoryMediaType } from "@/data/mockSocial";
import LiveStreamMode from "@/components/LiveStreamMode";
import TagAndLocationPicker, { TaggedPerson, LocationTag } from "@/components/TagAndLocationPicker";

const MY_STORIES_KEY = (uid: string) => `watcher:my-stories:${uid}`;

interface DraftFrame {
  id: string;
  file: File;
  preview: string;
  fileType: "image" | "video";
  caption: string;
}

interface StoryComposerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPublished?: () => void;
}

const StoryComposer = ({ open, onOpenChange, onPublished }: StoryComposerProps) => {
  const { user, profile } = useAuth();
  const [frames, setFrames] = useState<DraftFrame[]>([]);
  const [current, setCurrent] = useState(0);
  const [storyType, setStoryType] = useState<StoryMediaType>("photo");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [liveMode, setLiveMode] = useState(false);

  const reset = () => {
    frames.forEach((f) => URL.revokeObjectURL(f.preview));
    setFrames([]);
    setCurrent(0);
    setStoryType("photo");
    setTrackTitle("");
    setTrackArtist("");
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      frames.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (posting) return;
    reset();
    setLiveMode(false);
    onOpenChange(false);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next: DraftFrame[] = [];
    Array.from(files).forEach((file) => {
      const isVid = file.type.startsWith("video/");
      const isImg = file.type.startsWith("image/");
      if (!isVid && !isImg) return;
      next.push({
        id: Math.random().toString(36).slice(2, 9),
        file,
        preview: URL.createObjectURL(file),
        fileType: isVid ? "video" : "image",
        caption: "",
      });
    });
    if (next.length === 0) return;
    setFrames((prev) => {
      const merged = [...prev, ...next];
      // Auto-detect story type from first frame
      if (prev.length === 0) {
        setStoryType(next[0].fileType === "video" ? "video" : "photo");
      }
      return merged;
    });
    e.target.value = "";
  };

  const removeFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const next = prev.filter((f) => f.id !== id);
      if (current >= next.length && next.length > 0) setCurrent(next.length - 1);
      if (next.length === 0) setCurrent(0);
      return next;
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, caption } : f)));
  };

  const publish = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    if (frames.length === 0) return;

    setPosting(true);
    try {
      // Upload each frame to the media bucket
      const uploaded: StoryFrame[] = [];
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        const ext = f.file.name.split(".").pop() || (f.fileType === "video" ? "mp4" : "jpg");
        const path = `${user.id}/stories/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, f.file, {
          contentType: f.file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        uploaded.push({
          url: urlData.publicUrl,
          caption: f.caption.trim() || undefined,
          trackTitle: i === 0 && storyType === "music" && trackTitle.trim() ? trackTitle.trim() : undefined,
          trackArtist:
            i === 0 && storyType === "music" && trackArtist.trim() ? trackArtist.trim() : undefined,
        });
      }

      // Persist to localStorage in a shape that's backward-compatible with ActivityView
      const myStory = {
        id: Date.now(),
        username: profile?.display_name || profile?.username || "You",
        avatar:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username ?? "you"}`,
        thumbnail: uploaded[0].url,
        caption: uploaded[0].caption ?? "",
        mediaType: storyType,
        created_at: new Date().toISOString(),
        frames: uploaded,
      };

      const key = MY_STORIES_KEY(user.id);
      const existing = (() => {
        try {
          return JSON.parse(localStorage.getItem(key) ?? "[]");
        } catch {
          return [];
        }
      })();
      localStorage.setItem(key, JSON.stringify([myStory, ...existing]));
      window.dispatchEvent(new CustomEvent("watcher:my-stories-changed"));

      toast.success("Story published");
      reset();
      onOpenChange(false);
      onPublished?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not publish story");
    } finally {
      setPosting(false);
    }
  };

  const active = frames[current];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden max-h-[92vh] flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button onClick={handleClose} className="neo-button-icon p-2" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="font-semibold flex-1 text-center">
              {liveMode ? "Live Co-share" : "New Story"}
            </DialogTitle>
            {liveMode ? (
              <span className="w-9" />
            ) : (
              <button
                onClick={publish}
                disabled={frames.length === 0 || posting}
                className="action-button action-button-primary py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {posting && <Loader2 className="w-4 h-4 animate-spin" />}
                Share
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {liveMode ? (
            <LiveStreamMode onClose={() => setLiveMode(false)} />
          ) : (<>

          {/* Frame preview area */}
          {active ? (
            <div className="relative neo-card-inset rounded-2xl overflow-hidden">
              <div className="relative aspect-[9/14] bg-black">
                {active.fileType === "video" ? (
                  <video
                    key={active.id}
                    src={active.preview}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <img src={active.preview} alt="" className="w-full h-full object-cover" />
                )}

                {/* Frame nav */}
                {frames.length > 1 && (
                  <>
                    {current > 0 && (
                      <button
                        onClick={() => setCurrent((c) => c - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 neo-button-icon p-2 bg-background/80 backdrop-blur-sm"
                        aria-label="Previous frame"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {current < frames.length - 1 && (
                      <button
                        onClick={() => setCurrent((c) => c + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 neo-button-icon p-2 bg-background/80 backdrop-blur-sm"
                        aria-label="Next frame"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}

                {/* Per-frame progress dots */}
                <div className="absolute top-2 left-2 right-2 flex gap-1">
                  {frames.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full ${
                        i === current ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => removeFrame(active.id)}
                  className="absolute top-3 right-3 neo-button-icon p-1.5 bg-background/80 backdrop-blur-sm"
                  aria-label="Remove frame"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>

              {/* Caption per frame */}
              <div className="p-3">
                <input
                  type="text"
                  value={active.caption}
                  onChange={(e) => updateCaption(active.id, e.target.value)}
                  placeholder="Add a caption to this frame…"
                  maxLength={140}
                  className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 p-2 pt-0 overflow-x-auto">
                {frames.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setCurrent(i)}
                    className={`relative flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden ${
                      i === current ? "ring-2 ring-primary" : "opacity-70"
                    }`}
                  >
                    {f.fileType === "video" ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Film className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex-shrink-0 w-12 h-16 neo-button-icon rounded-lg flex items-center justify-center"
                  aria-label="Add another frame"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="neo-card-inset w-full aspect-[9/14] rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="flex gap-3">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="neo-button-icon p-4"
                  aria-label="Camera"
                >
                  <Camera className="w-8 h-8 text-primary" />
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="neo-button-icon p-4"
                  aria-label="Video"
                >
                  <Film className="w-8 h-8 text-primary" />
                </button>
                <button
                  onClick={() => setLiveMode(true)}
                  className="neo-button-icon p-4 relative"
                  aria-label="Go Live"
                >
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-full w-full bg-red-500" />
                  </span>
                  <Radio className="w-8 h-8 text-red-500" />
                </button>
              </div>
              <div className="text-center px-6">
                <p className="font-semibold">Pick photos, videos, or go live</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Each file becomes one story frame · 5s each
                </p>
              </div>
            </div>
          )}

          {/* Story type selector */}
          {frames.length > 0 && (
            <div className="neo-card-inset rounded-xl p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
                Story type
              </p>
              <div className="flex gap-1.5">
                {([
                  { key: "photo", label: "Photo", icon: ImageIcon },
                  { key: "video", label: "Video", icon: Film },
                  { key: "music", label: "Music", icon: Music },
                ] as { key: StoryMediaType; label: string; icon: any }[]).map((t) => {
                  const Icon = t.icon;
                  const active = storyType === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setStoryType(t.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active ? "neo-card-inset text-primary" : "neo-button text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Music metadata */}
          {frames.length > 0 && storyType === "music" && (
            <div className="neo-card-inset rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Music className="w-3.5 h-3.5 text-primary" /> Now playing
              </div>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="Track title"
                maxLength={60}
                className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm"
              />
              <input
                type="text"
                value={trackArtist}
                onChange={(e) => setTrackArtist(e.target.value)}
                placeholder="Artist"
                maxLength={60}
                className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm"
              />
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handlePick}
            className="hidden"
          />
          </>)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryComposer;
