import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Music, Camera, Video as VideoIcon, ChevronLeft, ChevronRight, Pause, Eye } from "lucide-react";
import { stories as defaultStories, type StoryItem } from "@/data/mockSocial";
import type { StoryViewer as ViewerRow } from "@/hooks/useStoryViewers";
import WaveProgress from "./WaveProgress";
import { CIRCLE_THEMES, ringGradientFor } from "@/lib/circleTheme";

const BASE_FRAME_DURATION_MS = 5000;
const DEFAULT_BPM = 120;
/** Snap frame duration to whole beats so music frames advance on-beat. */
const beatSnappedDuration = (bpm: number, base = BASE_FRAME_DURATION_MS) => {
  const beatMs = (60 / bpm) * 1000;
  const beats = Math.max(1, Math.round(base / beatMs));
  return beats * beatMs;
};
const AVATAR_FALLBACK = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;

interface StoryViewerProps {
  startId: number;
  open: boolean;
  onClose: () => void;
  onWatched?: (storyId: number) => void;
  onFrameView?: (dbId: string) => void;
  /** True when the currently-viewed story belongs to the signed-in user. */
  isOwnList?: (storyIdx: number) => boolean;
  /** Map of story-frame dbId → viewer rows. Only relevant for own stories. */
  viewersByFrame?: Record<string, ViewerRow[]>;
  /** Optional list of stories to display. Falls back to default mock stories. */
  list?: StoryItem[];
}

const TypeIcon = ({ type }: { type?: string }) => {
  if (type === "video") return <VideoIcon className="w-3.5 h-3.5" />;
  if (type === "photo") return <Camera className="w-3.5 h-3.5" />;
  return <Music className="w-3.5 h-3.5" />;
};

const StoryViewer = ({
  startId,
  open,
  onClose,
  onWatched,
  onFrameView,
  isOwnList,
  viewersByFrame,
  list: listProp,
}: StoryViewerProps) => {
  const list: StoryItem[] = (listProp ?? defaultStories).filter(
    (s) => s.frames && s.frames.length > 0,
  );
  const [storyIdx, setStoryIdx] = useState(() => Math.max(0, list.findIndex((s) => s.id === startId)));
  const [frameIdx, setFrameIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumRef = useRef<number>(0);
  const holdTimerRef = useRef<number | null>(null);
  const reportedRef = useRef<Set<string>>(new Set());

  const story = list[storyIdx];
  const frame = story?.frames?.[frameIdx];
  const isOwn = !!isOwnList?.(storyIdx);
  const frameViewers = (frame?.dbId && viewersByFrame?.[frame.dbId]) || [];

  // Reset on open / startId change
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, list.findIndex((s) => s.id === startId));
    setStoryIdx(idx);
    setFrameIdx(0);
    setProgress(0);
    accumRef.current = 0;
    setPaused(false);
    setViewersOpen(false);
    reportedRef.current = new Set();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId]);

  // Mark each visible frame as viewed (once per session) when it comes into view.
  useEffect(() => {
    if (!open || !frame?.dbId) return;
    if (reportedRef.current.has(frame.dbId)) return;
    reportedRef.current.add(frame.dbId);
    onFrameView?.(frame.dbId);
  }, [open, frame?.dbId, onFrameView]);

  const goNext = useCallback(() => {
    if (!story) return;
    if (onWatched) onWatched(story.id);
    const total = story.frames?.length ?? 0;
    if (frameIdx + 1 < total) {
      setFrameIdx((i) => i + 1);
      setProgress(0);
      accumRef.current = 0;
    } else if (storyIdx + 1 < list.length) {
      setStoryIdx((i) => i + 1);
      setFrameIdx(0);
      setProgress(0);
      accumRef.current = 0;
    } else {
      onClose();
    }
  }, [story, frameIdx, storyIdx, list.length, onClose, onWatched]);

  const goPrev = useCallback(() => {
    if (frameIdx > 0) {
      setFrameIdx((i) => i - 1);
      setProgress(0);
      accumRef.current = 0;
    } else if (storyIdx > 0) {
      const prev = list[storyIdx - 1];
      setStoryIdx((i) => i - 1);
      setFrameIdx((prev.frames?.length ?? 1) - 1);
      setProgress(0);
      accumRef.current = 0;
    } else {
      setProgress(0);
      accumRef.current = 0;
    }
  }, [frameIdx, storyIdx, list]);

  // Animation loop
  useEffect(() => {
    if (!open || paused || !story || viewersOpen) return;
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
  }, [open, paused, viewersOpen, storyIdx, frameIdx, story, goNext]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewersOpen) setViewersOpen(false);
        else onClose();
      } else if (e.key === "ArrowRight") { accumRef.current = 0; goNext(); }
      else if (e.key === "ArrowLeft") { accumRef.current = 0; goPrev(); }
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goNext, goPrev, onClose, viewersOpen]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !story || !frame) return null;

  const handlePointerDown = () => {
    holdTimerRef.current = window.setTimeout(() => setPaused(true), 180);
  };
  const handlePointerUp = (side: "left" | "right") => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    if (paused) { setPaused(false); return; }
    accumRef.current = 0;
    if (side === "left") goPrev(); else goNext();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" role="dialog" aria-modal>
      {/* Media */}
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden">
        {/^.*\.(mp4|webm|mov|m4v)(\?|$)/i.test(frame.url) ? (
          <video
            key={`${story.id}-${frameIdx}`}
            src={frame.url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            loop
          />
        ) : (
          <img
            key={`${story.id}-${frameIdx}`}
            src={frame.url}
            alt={frame.caption ?? story.username}
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-200"
            draggable={false}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {story.frames!.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < frameIdx ? "100%" : i === frameIdx ? `${progress * 100}%` : "0%",
                  transition: i === frameIdx ? "none" : "width 120ms linear",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 flex items-center gap-2 z-20 mt-1">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 flex-shrink-0">
            <img src={story.avatar} alt={story.username} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-white">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate drop-shadow">{story.username}</p>
              <span className="opacity-75"><TypeIcon type={story.mediaType} /></span>
            </div>
            <p className="text-[10px] opacity-80">just now</p>
          </div>
          {paused && (
            <span className="text-white/90 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mr-1">
              <Pause className="w-3 h-3" /> Paused
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Close story"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tap zones */}
        <button
          aria-label="Previous"
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-start pl-2 text-white/0 hover:text-white/40 transition-colors"
          onPointerDown={handlePointerDown}
          onPointerUp={() => handlePointerUp("left")}
          onPointerLeave={() => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          aria-label="Next"
          className="absolute right-0 top-0 bottom-0 w-2/3 z-10 flex items-center justify-end pr-2 text-white/0 hover:text-white/40 transition-colors"
          onPointerDown={handlePointerDown}
          onPointerUp={() => handlePointerUp("right")}
          onPointerLeave={() => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Caption / track info */}
        {(frame.caption || frame.trackTitle) && (
          <div className="absolute bottom-20 left-4 right-4 z-20 text-white">
            {frame.trackTitle && (
              <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 mb-2">
                <Music className="w-3.5 h-3.5 text-[hsl(45,100%,60%)]" />
                <span className="text-xs font-semibold">{frame.trackTitle}</span>
                {frame.trackArtist && <span className="text-[11px] opacity-75">— {frame.trackArtist}</span>}
              </div>
            )}
            {frame.caption && (
              <p className="text-sm font-medium drop-shadow-lg">{frame.caption}</p>
            )}
          </div>
        )}

        {/* Owner-only viewer count chip */}
        {isOwn && frame.dbId && (
          <button
            onClick={(e) => { e.stopPropagation(); setViewersOpen(true); }}
            aria-label="See viewers"
            className="absolute bottom-5 left-4 z-30 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full px-3 py-2 text-white border border-white/15 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-semibold tabular-nums">{frameViewers.length}</span>
            <span className="text-xs opacity-80">{frameViewers.length === 1 ? "viewer" : "viewers"}</span>
          </button>
        )}

        {/* Viewers sheet */}
        {isOwn && viewersOpen && (
          <div
            className="absolute inset-0 z-40 flex items-end"
            onClick={() => setViewersOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-h-[60%] bg-background rounded-t-3xl p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3" />
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  {frameViewers.length} {frameViewers.length === 1 ? "viewer" : "viewers"}
                </h3>
              </div>
              {frameViewers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No one has viewed this frame yet.
                </p>
              ) : (
                <ul className="space-y-2 pb-2">
                  {frameViewers.map((v) => (
                    <li key={v.viewer_id} className="flex items-center gap-3 py-1.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={v.avatar_url || AVATAR_FALLBACK(v.username ?? v.viewer_id)}
                          alt={v.username ?? "viewer"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {v.display_name || v.username || "Someone"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(v.viewed_at).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
