import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Music, Video, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

type Mode = "track" | "video";

const ArtistUploadDialog = ({ open, onOpenChange, onUploaded }: Props) => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<Mode>("track");
  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<"single" | "ep" | "album">("single");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mediaRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setReleaseType("single");
    setMediaFile(null);
    setCoverFile(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return toast.error("Sign in required");
    if (profile?.account_type !== "artist") return toast.error("Become an artist first");
    if (!title.trim()) return toast.error("Title required");
    if (!mediaFile) return toast.error(mode === "track" ? "Audio file required" : "Video file required");

    setSubmitting(true);
    try {
      const mediaUrl = await upload(mediaFile);
      const coverUrl = coverFile ? await upload(coverFile) : null;

      if (mode === "track") {
        const { error } = await supabase.from("tracks").insert({
          artist_id: user.id,
          title: title.trim(),
          audio_url: mediaUrl,
          cover_url: coverUrl,
          release_type: releaseType,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos").insert({
          artist_id: user.id,
          title: title.trim(),
          video_url: mediaUrl,
          thumbnail_url: coverUrl,
        });
        if (error) throw error;
      }

      toast.success(mode === "track" ? "Track released! 🎵" : "Video published! 🎬");
      onUploaded?.();
      close();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border/50 flex-row items-center justify-between space-y-0">
          <DialogTitle>Release {mode === "track" ? "Track" : "Video"}</DialogTitle>
          <button onClick={close} className="neo-button-icon p-2"><X className="w-4 h-4" /></button>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMode("track"); setMediaFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${mode === "track" ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"}`}
            >
              <Music className="w-4 h-4" /> Track
            </button>
            <button
              onClick={() => { setMode("video"); setMediaFile(null); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${mode === "video" ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"}`}
            >
              <Video className="w-4 h-4" /> Video
            </button>
          </div>

          {/* Title */}
          <div className="neo-card-inset rounded-xl px-4 py-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {/* Release type for tracks */}
          {mode === "track" && (
            <div className="flex gap-2">
              {(["single", "ep", "album"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setReleaseType(r)}
                  className={`flex-1 py-2 rounded-xl text-xs uppercase tracking-wider transition-all ${releaseType === r ? "neo-card-inset text-primary" : "neo-button-icon text-muted-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Media file */}
          <button
            onClick={() => mediaRef.current?.click()}
            className="neo-card-inset w-full rounded-xl p-4 flex items-center gap-3 text-left"
          >
            <div className="neo-button-icon p-2 text-primary"><Upload className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {mediaFile?.name || (mode === "track" ? "Choose audio file" : "Choose video file")}
              </p>
              <p className="text-xs text-muted-foreground">
                {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(1)} MB` : mode === "track" ? "MP3, WAV, M4A" : "MP4, MOV"}
              </p>
            </div>
          </button>
          <input
            ref={mediaRef}
            type="file"
            accept={mode === "track" ? "audio/*" : "video/*"}
            onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          {/* Cover/thumbnail */}
          <button
            onClick={() => coverRef.current?.click()}
            className="neo-card-inset w-full rounded-xl p-4 flex items-center gap-3 text-left"
          >
            <div className="neo-button-icon p-2 text-primary"><Upload className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {coverFile?.name || (mode === "track" ? "Cover art (optional)" : "Thumbnail (optional)")}
              </p>
              <p className="text-xs text-muted-foreground">JPG or PNG</p>
            </div>
          </button>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="action-button action-button-primary w-full flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publish
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistUploadDialog;
