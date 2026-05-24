import { useEffect, useRef, useState } from "react";
import { X, Image as ImageIcon, Film, Music, Camera, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Radio, Globe2, Lock, Users, Heart, UsersRound, Maximize2, Minimize2, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { StoryMediaType } from "@/data/mockSocial";
import LiveStreamMode from "@/components/LiveStreamMode";
import TagAndLocationPicker, { TaggedPerson, LocationTag } from "@/components/TagAndLocationPicker";
import { LocationPicker } from "@/components/LocationPicker";
import { SavedLocation } from "@/lib/places";
import type { FriendCircleEnum } from "@/hooks/useFriendCircles";
import { CIRCLE_THEMES } from "@/lib/circleTheme";
import StoryCamera from "@/components/stories/StoryCamera";
import FilterCarousel from "@/components/stories/FilterCarousel";
import IntensitySlider from "@/components/stories/IntensitySlider";
import StoryParticles from "@/components/stories/StoryParticles";
import { FILTER_NONE, FilterPreset, getFilterById, cssFilterAt, overlayStrength } from "@/lib/storyFilters";
import { useFavoriteFilters } from "@/hooks/useFavoriteFilters";

interface DraftFrame {
  id: string;
  file: File;
  preview: string;
  fileType: "image" | "video";
  caption: string;
  /** Per-frame filter so the user can vary the look across slides. */
  filterId: string;
  filterIntensity: number;
}

interface StoryComposerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPublished?: () => void;
}

const StoryComposer = ({ open, onOpenChange, onPublished }: StoryComposerProps) => {
  const { user } = useAuth();
  const [frames, setFrames] = useState<DraftFrame[]>([]);
  const [current, setCurrent] = useState(0);
  const [storyType, setStoryType] = useState<StoryMediaType>("photo");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [tagged, setTagged] = useState<TaggedPerson[]>([]);
  const [location, setLocation] = useState<LocationTag | null>(null);
  const [geoLocation, setGeoLocation] = useState<SavedLocation | null>(null);
  /** null = public; otherwise scoped to the chosen friend circle. */
  const [audience, setAudience] = useState<FriendCircleEnum | null>(null);
  /** Toggles between the inline preview and a full-screen "maximised" view. */
  const [maximized, setMaximized] = useState(false);
  /** Open the in-app capture camera with live filters. */
  const [cameraOpen, setCameraOpen] = useState(false);
  /** Filter UI panel (carousel + intensity) toggle for uploaded media. */
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { favorites, toggleFavorite } = useFavoriteFilters();

  const reset = () => {
    frames.forEach((f) => URL.revokeObjectURL(f.preview));
    setFrames([]);
    setCurrent(0);
    setStoryType("photo");
    setTrackTitle("");
    setTrackArtist("");
    setTagged([]);
    setLocation(null);
    setAudience(null);
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
        filterId: "none",
        filterIntensity: 100,
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
      // Make sure we have a fresh access token before uploading — without it,
      // supabase-js falls back to the anon key and storage RLS rejects the upload.
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        toast.error("Your session expired. Please sign in again.");
        setPosting(false);
        return;
      }
      // Upload each frame to media storage, then insert one stories row per frame
      const rows: any[] = [];
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
        const tagSuffix = i === 0 && tagged.length ? " " + tagged.map((t) => `@${t.handle}`).join(" ") : "";
        const locPrefix = i === 0 && location ? `📍 ${location.name} · ` : "";
        const caption = ((locPrefix + (f.caption.trim() || "")) + tagSuffix).trim() || null;
        rows.push({
          user_id: user.id,
          media_type: storyType,
          media_url: urlData.publicUrl,
          caption,
          audience_circle: audience,
          location_id: i === 0 ? geoLocation?.id ?? null : null,
          filter_id: f.filterId === "none" ? null : f.filterId,
          filter_intensity: f.filterIntensity,
          track_title:
            i === 0 && storyType === "music" && trackTitle.trim() ? trackTitle.trim() : null,
          track_artist:
            i === 0 && storyType === "music" && trackArtist.trim() ? trackArtist.trim() : null,
        });
      }

      const { error: insErr } = await supabase.from("stories").insert(rows);
      if (insErr) throw insErr;

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
      {/* Full-screen maximised preview — overlays the dialog without disrupting form state. */}
      {maximized && active && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setMaximized(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMaximized(false); }}
            className="absolute top-4 right-4 neo-button-icon p-2 bg-background/20 backdrop-blur-sm text-white"
            aria-label="Minimise preview"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          {active.fileType === "video" ? (
            <video
              src={active.preview}
              className="max-w-full max-h-full object-contain"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={active.preview}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
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
                {(() => {
                  const preset = getFilterById(active.filterId);
                  const t = overlayStrength(active.filterIntensity);
                  const fStyle = { filter: cssFilterAt(preset, active.filterIntensity) } as const;
                  return (
                    <>
                      {active.fileType === "video" ? (
                        <video
                          key={active.id}
                          src={active.preview}
                          className="w-full h-full object-cover"
                          style={fStyle}
                          controls
                          playsInline
                        />
                      ) : (
                        <img src={active.preview} alt="" className="w-full h-full object-cover" style={fStyle} />
                      )}
                      {preset.tint && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: preset.tint.color,
                            opacity: preset.tint.opacity * t,
                            mixBlendMode: preset.tint.blend ?? "soft-light",
                          }}
                        />
                      )}
                      {preset.vignette && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow: `inset 0 0 ${80 + preset.vignette * t * 120}px ${20 + preset.vignette * t * 80}px rgba(0,0,0,${preset.vignette * t * 0.85})`,
                          }}
                        />
                      )}
                      {preset.particles && (
                        <StoryParticles kind={preset.particles} intensity={t} />
                      )}
                    </>
                  );
                })()}

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
                  onClick={() => setMaximized(true)}
                  className="absolute top-3 left-3 neo-button-icon p-1.5 bg-background/80 backdrop-blur-sm"
                  aria-label="Maximise preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setFilterPanelOpen((v) => !v)}
                  className={`absolute top-3 right-12 neo-button-icon p-1.5 bg-background/80 backdrop-blur-sm ${
                    active.filterId !== "none" ? "text-primary" : ""
                  }`}
                  aria-label="Filters"
                  aria-pressed={filterPanelOpen}
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => removeFrame(active.id)}
                  className="absolute top-3 right-3 neo-button-icon p-1.5 bg-background/80 backdrop-blur-sm"
                  aria-label="Remove frame"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>

                {active.filterId !== "none" && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold pointer-events-none">
                    {getFilterById(active.filterId).name}
                  </div>
                )}
              </div>

              {/* Filter panel */}
              {filterPanelOpen && (
                <div className="bg-background/95 border-t border-border/50 animate-fade-in">
                  {active.filterId !== "none" && (
                    <div className="px-3 pt-3">
                      <IntensitySlider
                        value={active.filterIntensity}
                        onChange={(v) =>
                          setFrames((prev) =>
                            prev.map((f) =>
                              f.id === active.id ? { ...f, filterIntensity: v } : f,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                  <FilterCarousel
                    previewSrc={active.fileType === "image" ? active.preview : undefined}
                    selectedId={active.filterId}
                    onSelect={(p: FilterPreset) =>
                      setFrames((prev) =>
                        prev.map((f) =>
                          f.id === active.id ? { ...f, filterId: p.id } : f,
                        ),
                      )
                    }
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              )}

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

          {/* Audience / circle picker */}
          {frames.length > 0 && (
            <div className="neo-card-inset rounded-xl p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
                Who can see this
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { key: null, label: "Public", icon: Globe2, hsl: "var(--muted-foreground)" },
                  { key: "private" as const, label: CIRCLE_THEMES.private.label, icon: Lock, hsl: CIRCLE_THEMES.private.hsl },
                  { key: "family" as const, label: CIRCLE_THEMES.family.label, icon: Heart, hsl: CIRCLE_THEMES.family.hsl },
                  { key: "friends" as const, label: CIRCLE_THEMES.friends.label, icon: Users, hsl: CIRCLE_THEMES.friends.hsl },
                  { key: "groups" as const, label: CIRCLE_THEMES.groups.label, icon: UsersRound, hsl: CIRCLE_THEMES.groups.hsl },
                ]).map((opt) => {
                  const Icon = opt.icon;
                  const active = audience === opt.key;
                  return (
                    <button
                      key={opt.key ?? "public"}
                      onClick={() => setAudience(opt.key)}
                      className={`flex-1 min-w-[72px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active ? "neo-card-inset" : "neo-button text-muted-foreground"
                      }`}
                      style={
                        active
                          ? {
                              color: opt.key ? `hsl(${opt.hsl})` : undefined,
                              boxShadow: opt.key
                                ? `inset 0 0 0 1px hsl(${opt.hsl} / 0.4)`
                                : undefined,
                            }
                          : undefined
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {audience && (
                <p className="px-2 pt-1.5 text-[10px] text-muted-foreground">
                  Only members of your <span className="font-semibold" style={{ color: `hsl(${CIRCLE_THEMES[audience].hsl})` }}>{CIRCLE_THEMES[audience].label.toLowerCase()}</span> circle will see this story.
                </p>
              )}
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

          {/* Tag people + location (photo & video stories) */}
          {frames.length > 0 && storyType !== "music" && (
            <>
              <TagAndLocationPicker
                tagged={tagged}
                setTagged={setTagged}
                location={location}
                setLocation={setLocation}
              />
              <LocationPicker value={geoLocation} onChange={setGeoLocation} />
            </>
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
