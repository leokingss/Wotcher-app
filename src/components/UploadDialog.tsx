import { useState, useRef } from "react";
import { X, Image, Film, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

type AuctionDuration = "1d" | "3d" | "7d" | "custom";

const UploadDialog = ({ open, onOpenChange, onUploaded }: UploadDialogProps) => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Marketplace state
  const [forSale, setForSale] = useState(false);
  const [saleType, setSaleType] = useState<"fixed" | "auction">("fixed");
  const [itemTitle, setItemTitle] = useState("");
  const [price, setPrice] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [duration, setDuration] = useState<AuctionDuration>("3d");
  const [customEnd, setCustomEnd] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (isImage || isVideo) {
        newMediaFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          type: isVideo ? "video" : "image",
        });
      }
    });

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (currentSlide >= updated.length && updated.length > 0) {
        setCurrentSlide(updated.length - 1);
      }
      return updated;
    });
  };

  const handlePost = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    if (mediaFiles.length === 0) return;
    setPosting(true);
    try {
      const first = mediaFiles[0];
      const ext = first.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, first.file, {
        contentType: first.file.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const { error: insErr } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim() || null,
        image_url: urlData.publicUrl,
        media_type: first.type,
      });
      if (insErr) throw insErr;
      toast.success("Posted!");
      setMediaFiles([]);
      setCaption("");
      setCurrentSlide(0);
      onOpenChange(false);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setPosting(false);
    }
  };

  const handleClose = () => {
    setMediaFiles([]);
    setCaption("");
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const nextSlide = () => {
    if (currentSlide < mediaFiles.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <button onClick={handleClose} className="neo-button-icon p-2">
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="font-semibold">Create Post</DialogTitle>
            <button
              onClick={handlePost}
              disabled={mediaFiles.length === 0 || posting}
              className="action-button action-button-primary py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post
            </button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Media Preview Area */}
          {mediaFiles.length > 0 ? (
            <div className="relative neo-card-inset rounded-2xl overflow-hidden">
              <div className="aspect-square relative">
                {mediaFiles[currentSlide]?.type === "video" ? (
                  <video
                    src={mediaFiles[currentSlide].preview}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={mediaFiles[currentSlide]?.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Navigation Arrows */}
                {mediaFiles.length > 1 && (
                  <>
                    {currentSlide > 0 && (
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 neo-button-icon p-2 bg-background/80 backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {currentSlide < mediaFiles.length - 1 && (
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 neo-button-icon p-2 bg-background/80 backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}

                {/* Slide Indicators */}
                {mediaFiles.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {mediaFiles.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide
                            ? "bg-primary w-4"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeMedia(mediaFiles[currentSlide].id)}
                  className="absolute top-2 right-2 neo-button-icon p-1.5 bg-background/80 backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              {mediaFiles.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {mediaFiles.map((media, index) => (
                    <button
                      key={media.id}
                      onClick={() => setCurrentSlide(index)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden ${
                        index === currentSlide ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {media.type === "video" ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Film className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <img
                          src={media.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-14 h-14 neo-button-icon rounded-lg flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Upload Area */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="neo-card-inset w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex gap-3">
                <div className="neo-button-icon p-4">
                  <Image className="w-8 h-8 text-primary" />
                </div>
                <div className="neo-button-icon p-4">
                  <Film className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold">Add Photos or Videos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap to select multiple files
                </p>
              </div>
            </button>
          )}

          {/* Caption Input */}
          <div className="neo-card-inset rounded-xl p-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full bg-transparent resize-none outline-none text-sm min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
