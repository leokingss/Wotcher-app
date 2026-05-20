import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image, Film, Plus, ChevronLeft, ChevronRight, Loader2, ShoppingBag, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import TagAndLocationPicker, { TaggedPerson, LocationTag } from "@/components/TagAndLocationPicker";

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
  const navigate = useNavigate();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagged, setTagged] = useState<TaggedPerson[]>([]);
  const [location, setLocation] = useState<LocationTag | null>(null);
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("seller_stripe_accounts")
        .select("charges_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setPayoutReady(!!data?.charges_enabled);
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  // Marketplace state
  const [forSale, setForSale] = useState(false);
  const [saleType, setSaleType] = useState<"fixed" | "auction">("fixed");
  const [itemTitle, setItemTitle] = useState("");
  const [price, setPrice] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [duration, setDuration] = useState<AuctionDuration>("3d");
  const [customEnd, setCustomEnd] = useState("");
  const [fulfillment, setFulfillment] = useState<"shipping" | "pickup">("shipping");
  const [returnPolicy, setReturnPolicy] = useState<"none" | "15_days" | "30_days">("none");

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

  const computeEndsAt = (): string | null => {
    if (saleType !== "auction") return null;
    if (duration === "custom") return customEnd ? new Date(customEnd).toISOString() : null;
    const ms = duration === "1d" ? 86_400_000 : duration === "3d" ? 3 * 86_400_000 : 7 * 86_400_000;
    return new Date(Date.now() + ms).toISOString();
  };

  const handlePost = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    if (mediaFiles.length === 0) return;
    if (forSale) {
      if (!payoutReady) {
        toast.error("Connect your payout account to list items for sale");
        onOpenChange(false);
        navigate("/payouts");
        return;
      }
      if (!itemTitle.trim()) { toast.error("Add an item title"); return; }
      if (saleType === "fixed" && !(parseFloat(price) > 0)) { toast.error("Set a price"); return; }
      if (saleType === "auction" && !(parseFloat(startingBid) >= 0)) { toast.error("Set a starting bid"); return; }
      if (saleType === "auction" && duration === "custom" && !customEnd) { toast.error("Pick an end date"); return; }
    }
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
      const tagSuffix = tagged.length ? "\n" + tagged.map((t) => `@${t.handle}`).join(" ") : "";
      const finalCaption = (caption.trim() + tagSuffix).trim() || null;
      const { data: postRow, error: insErr } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: finalCaption,
        image_url: urlData.publicUrl,
        media_type: first.type,
        location: location?.name ?? null,
      }).select("id").single();
      if (insErr) throw insErr;

      if (forSale && postRow) {
        const endsAt = computeEndsAt();
        const { error: lErr } = await supabase.from("listings").insert({
          post_id: postRow.id,
          seller_id: user.id,
          type: saleType,
          title: itemTitle.trim(),
          description: caption.trim() || null,
          price: saleType === "fixed" ? parseFloat(price) : null,
          starting_bid: saleType === "auction" ? parseFloat(startingBid) : null,
          ends_at: endsAt,
          fulfillment,
          shipping_required: fulfillment === "shipping",
          return_policy: returnPolicy,
        });
        if (lErr) throw lErr;
      }

      toast.success(forSale ? "Posted & listed for sale!" : "Posted!");
      setMediaFiles([]);
      setCaption("");
      setCurrentSlide(0);
      setForSale(false);
      setItemTitle("");
      setPrice("");
      setStartingBid("");
      setCustomEnd("");
      setTagged([]);
      setLocation(null);
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
    setForSale(false);
    setTagged([]);
    setLocation(null);
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
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] p-0 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border/50 flex-shrink-0">
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

        <div className="p-4 space-y-4 overflow-y-auto">

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

          {/* Tag people + location */}
          <TagAndLocationPicker
            tagged={tagged}
            setTagged={setTagged}
            location={location}
            setLocation={setLocation}
          />
          {/* For Sale toggle + form */}
          <div className="neo-card-inset rounded-xl p-3 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">List this item for sale</span>
              </div>
              <input
                type="checkbox"
                checked={forSale}
                onChange={(e) => setForSale(e.target.checked)}
                className="accent-primary w-5 h-5"
              />
            </label>

            {forSale && payoutReady === false && (
              <button
                type="button"
                onClick={() => { onOpenChange(false); navigate("/payouts"); }}
                className="w-full neo-card-inset rounded-xl p-3 flex items-start gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Connect your payout account</p>
                  <p className="text-[11px] text-muted-foreground">
                    Sellers must connect a payout account before listing. Tap to set it up.
                  </p>
                </div>
                <span className="text-xs text-primary font-semibold">Connect</span>
              </button>
            )}

            {forSale && payoutReady !== false && (
              <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSaleType("fixed")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${saleType === "fixed" ? "neo-card-inset text-primary" : "neo-button"}`}>
                    Fixed price
                  </button>
                  <button type="button" onClick={() => setSaleType("auction")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium ${saleType === "auction" ? "neo-card-inset text-primary" : "neo-button"}`}>
                    Auction
                  </button>
                </div>

                <input type="text" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Item title (e.g. Vintage vinyl)"
                  className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />

                {saleType === "fixed" ? (
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (USD)"
                    className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />
                ) : (
                  <>
                    <input type="number" min="0" step="0.01" value={startingBid} onChange={(e) => setStartingBid(e.target.value)}
                      placeholder="Starting bid (USD)"
                      className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["1d", "3d", "7d", "custom"] as AuctionDuration[]).map((d) => (
                        <button key={d} type="button" onClick={() => setDuration(d)}
                          className={`py-1.5 rounded-lg text-[11px] font-medium ${duration === d ? "neo-card-inset text-primary" : "neo-button"}`}>
                          {d === "1d" ? "24h" : d === "custom" ? "Custom" : d}
                        </button>
                      ))}
                    </div>
                    {duration === "custom" && (
                      <input type="datetime-local" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full neo-card-inset rounded-lg px-3 py-2 bg-transparent outline-none text-sm" />
                    )}
                  </>
                )}

                {/* Fulfillment */}
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Delivery</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => setFulfillment("shipping")}
                      className={`py-1.5 rounded-lg text-[11px] font-medium ${fulfillment === "shipping" ? "neo-card-inset text-primary" : "neo-button"}`}>
                      Ship to buyer
                    </button>
                    <button type="button" onClick={() => setFulfillment("pickup")}
                      className={`py-1.5 rounded-lg text-[11px] font-medium ${fulfillment === "pickup" ? "neo-card-inset text-primary" : "neo-button"}`}>
                      Local pickup
                    </button>
                  </div>
                </div>

                {/* Return policy */}
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Returns</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      ["none", "No returns"],
                      ["14_days", "14 days"],
                      ["30_days", "30 days"],
                    ] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setReturnPolicy(val)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium ${returnPolicy === val ? "neo-card-inset text-primary" : "neo-button"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
