import { useEffect, useRef, useState } from "react";
import {
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Timer,
  Circle,
  Loader2,
  Sparkle,
  Wand2,
} from "lucide-react";
import {
  FILTER_NONE,
  FilterPreset,
  cssFilterAt,
  overlayStrength,
} from "@/lib/storyFilters";
import FilterCarousel from "./FilterCarousel";
import IntensitySlider from "./IntensitySlider";
import StoryParticles from "./StoryParticles";
import BeautyPanel from "./BeautyPanel";
import AREffectCarousel from "./AREffectCarousel";
import {
  applyBeauty,
  BEAUTY_OFF,
  BeautyParams,
  ensureMode,
  isBeautyActive,
} from "@/lib/beauty/BeautyEngine";
import {
  AR_NONE,
  AREffectPreset,
  applyAREffect,
  isAREffectActive,
} from "@/lib/ar/arEffects";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { useFavoriteFilters } from "@/hooks/useFavoriteFilters";
import { toast } from "sonner";

interface StoryCameraProps {
  open: boolean;
  /** Called when the user discards the capture / closes the camera. */
  onClose: () => void;
  /**
   * Called when the user accepts a captured frame. The blob already has the
   * filter & overlays baked in (recorded from the canvas pipeline).
   */
  onCapture: (blob: Blob, opts: {
    fileType: "image" | "video";
    filterId: string;
    intensity: number;
    arEffectId: string;
    durationMs?: number;
    previewUrl: string;
  }) => void;
  /** Hard cap for video recordings, in ms. Stories are 20s max. */
  maxDurationMs?: number;
}

/**
 * Fullscreen story camera with a real-time filter pipeline.
 *
 * Pipeline:
 *   getUserMedia → <video> (hidden) → drawn each frame onto <canvas> with
 *   the active CSS filter set on the canvas context. Particles & vignette are
 *   composited above. The same canvas is what we record (via captureStream +
 *   MediaRecorder), so the saved video matches the live preview exactly.
 */
export const StoryCamera = ({
  open,
  onClose,
  onCapture,
  maxDurationMs = 20_000,
}: StoryCameraProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunks = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [flash, setFlash] = useState(false);
  const [timer, setTimer] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [filter, setFilter] = useState<FilterPreset>(FILTER_NONE);
  const [intensity, setIntensity] = useState(100);
  const [starting, setStarting] = useState(true);
  const [beauty, setBeauty] = useState<BeautyParams>(BEAUTY_OFF);
  const [beautyOpen, setBeautyOpen] = useState(false);
  const [beautyLoading, setBeautyLoading] = useState(false);
  const [arEffect, setArEffect] = useState<AREffectPreset>(AR_NONE);
  const [arOpen, setArOpen] = useState(false);
  /** Cached last landmark detection so we don't run detection every frame. */
  const landmarkResultRef = useRef<FaceLandmarkerResult | null>(null);
  const lastDetectRef = useRef<number>(0);
  const landmarkerRef = useRef<Awaited<ReturnType<typeof ensureMode>> | null>(null);

  const { favorites, toggleFavorite } = useFavoriteFilters();

  // Lazy-load FaceLandmarker the first time beauty or AR is turned on.
  const needsFace = isBeautyActive(beauty) || isAREffectActive(arEffect.id);
  useEffect(() => {
    if (!needsFace || landmarkerRef.current || beautyLoading) return;
    setBeautyLoading(true);
    ensureMode("VIDEO")
      .then((lm) => {
        landmarkerRef.current = lm;
      })
      .catch((e) => {
        console.error("FaceLandmarker init failed", e);
        toast.error("Couldn't load face filters");
      })
      .finally(() => setBeautyLoading(false));
  }, [needsFace, beautyLoading]);

  // ── Camera lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStarting(true);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStarting(false);
      } catch (e: any) {
        toast.error(
          e?.name === "NotAllowedError"
            ? "Camera permission denied"
            : "Couldn't access camera",
        );
        onClose();
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  // ── Render loop: draw video onto canvas with filter applied ─────────────
  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2) {
        // Match canvas to video aspect (portrait).
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
        }
        // Apply filter on context (GPU-accelerated where supported).
        // @ts-ignore — CanvasRenderingContext2D.filter is widely supported.
        ctx.filter = cssFilterAt(filter, intensity);

        // Mirror front camera to match user expectations.
        if (facing === "user") {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // @ts-ignore
        ctx.filter = "none";

        // ── Beauty pack ───────────────────────────────────────────────────
        // Detect landmarks at most every ~80ms to keep the loop smooth, then
        // composite skin-smooth / eye-brighten / teeth-whiten / contour layers
        // on top of the already-graded canvas.
        if (isBeautyActive(beauty) && landmarkerRef.current) {
          const now = performance.now();
          if (now - lastDetectRef.current > 80) {
            try {
              landmarkResultRef.current =
                landmarkerRef.current.detectForVideo(video, now);
            } catch (e) {
              // Detection can throw when the video isn't ready; silently skip.
            }
            lastDetectRef.current = now;
          }
          applyBeauty(
            canvas,
            canvas,
            landmarkResultRef.current,
            beauty,
            facing === "user",
          );
        }


        // Tint
        const t = overlayStrength(intensity);
        if (filter.tint) {
          ctx.save();
          ctx.globalAlpha = filter.tint.opacity * t;
          ctx.globalCompositeOperation =
            (filter.tint.blend === "screen" ? "screen" : "soft-light") as GlobalCompositeOperation;
          ctx.fillStyle = filter.tint.color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        // Vignette
        if (filter.vignette) {
          const va = filter.vignette * t;
          const grad = ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            Math.min(canvas.width, canvas.height) * 0.35,
            canvas.width / 2,
            canvas.height / 2,
            Math.max(canvas.width, canvas.height) * 0.7,
          );
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, `rgba(0,0,0,${va * 0.85})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open, filter, intensity, facing, beauty]);

  // ── Recording progress + auto-stop ──────────────────────────────────────
  useEffect(() => {
    if (!recording) return;
    const tick = () => {
      const elapsed = performance.now() - recordStartRef.current;
      const pct = Math.min(1, elapsed / maxDurationMs);
      setRecordProgress(pct);
      if (pct >= 1) stopRecording();
      else rafProgress = requestAnimationFrame(tick);
    };
    let rafProgress = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, maxDurationMs]);

  // ── Capture helpers ─────────────────────────────────────────────────────
  const takePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(blob, {
          fileType: "image",
          filterId: filter.id,
          intensity,
          previewUrl: URL.createObjectURL(blob),
        });
      },
      "image/jpeg",
      0.92,
    );
  };

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    // Mix canvas video track with mic audio for sound.
    const canvasStream = canvas.captureStream(30);
    const audio = streamRef.current?.getAudioTracks() ?? [];
    audio.forEach((t) => canvasStream.addTrack(t));

    const mime =
      MediaRecorder.isTypeSupported("video/mp4;codecs=h264,aac")
        ? "video/mp4;codecs=h264,aac"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

    const mr = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    recordChunks.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) recordChunks.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(recordChunks.current, { type: mime });
      const dur = performance.now() - recordStartRef.current;
      onCapture(blob, {
        fileType: "video",
        filterId: filter.id,
        intensity,
        durationMs: dur,
        previewUrl: URL.createObjectURL(blob),
      });
    };
    recorderRef.current = mr;
    recordStartRef.current = performance.now();
    mr.start(250);
    setRecording(true);
  };

  const stopRecording = () => {
    const mr = recorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
    setRecordProgress(0);
  };

  const handleShutterDown = () => {
    if (timer && countdown == null) {
      let n = timer;
      setCountdown(n);
      const id = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(id);
          setCountdown(null);
          startRecording();
        } else setCountdown(n);
      }, 1000);
      return;
    }
    startRecording();
  };

  const handleShutterUp = () => {
    if (recording) stopRecording();
  };

  // Tap-to-photo (short press) is differentiated from hold-to-record by a
  // 250ms threshold tracked outside React.
  const tapTimerRef = useRef<number | null>(null);
  const onPointerDown = () => {
    tapTimerRef.current = window.setTimeout(handleShutterDown, 250);
  };
  const onPointerUp = () => {
    if (tapTimerRef.current != null) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      if (!recording) takePhoto();
      else handleShutterUp();
    } else {
      handleShutterUp();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {/* Live preview */}
      <div className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Particles overlay (rendered above canvas in the DOM) */}
        {filter.particles && (
          <StoryParticles kind={filter.particles} intensity={overlayStrength(intensity)} />
        )}

        {/* Flash flicker for paparazzi-style filter or explicit flash */}
        {flash && recording && (
          <div className="absolute inset-0 bg-white animate-pulse opacity-30" />
        )}

        {/* Top controls */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white">
          <button onClick={onClose} className="neo-button-icon p-2 bg-black/40 backdrop-blur-md" aria-label="Close camera">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFlash((v) => !v)}
              className="neo-button-icon p-2 bg-black/40 backdrop-blur-md"
              aria-label="Toggle flash"
              aria-pressed={flash}
            >
              {flash ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
              className="neo-button-icon p-2 bg-black/40 backdrop-blur-md flex items-center gap-1 text-xs font-semibold"
              aria-label="Timer mode"
            >
              <Timer className="w-5 h-5" />
              {timer > 0 && <span>{timer}s</span>}
            </button>
            <button
              onClick={() => setBeautyOpen((v) => !v)}
              className={`neo-button-icon p-2 bg-black/40 backdrop-blur-md ${
                isBeautyActive(beauty) ? "text-primary" : ""
              }`}
              aria-label="Beauty filters"
              aria-pressed={beautyOpen}
            >
              {beautyLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkle className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              className="neo-button-icon p-2 bg-black/40 backdrop-blur-md"
              aria-label="Switch camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Countdown */}
        {countdown != null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white text-8xl font-bold drop-shadow-2xl tabular-nums">
              {countdown}
            </span>
          </div>
        )}

        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Starting camera…
          </div>
        )}

        {/* Filter name pill */}
        {filter.id !== "none" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-fade-in">
            <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-semibold">
              {filter.name}
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel: beauty, intensity, carousel, shutter */}
      <div className="bg-gradient-to-t from-black via-black/95 to-black/0 pt-6 pb-6 space-y-3">
        {beautyOpen && (
          <div className="mx-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
            <BeautyPanel
              params={beauty}
              onChange={setBeauty}
              onReset={() => setBeauty(BEAUTY_OFF)}
            />
          </div>
        )}
        {filter.id !== "none" && (
          <div className="px-4">
            <IntensitySlider value={intensity} onChange={setIntensity} />
          </div>
        )}

        <FilterCarousel
          selectedId={filter.id}
          onSelect={setFilter}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />

        {/* Shutter */}
        <div className="flex items-center justify-center pt-1">
          <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
            aria-label={recording ? "Stop recording" : "Take photo or hold to record"}
          >
            {recording ? (
              <span className="block w-7 h-7 rounded-md bg-red-500" />
            ) : (
              <Circle className="w-16 h-16 text-black/10" strokeWidth={1} />
            )}
            {recording && (
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgb(239 68 68)"
                  strokeWidth="4"
                  strokeDasharray={`${recordProgress * 289} 289`}
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-white/60 px-4">
          Tap for photo · Hold for video (max 20s) · Swipe to change filter
        </p>
      </div>
    </div>
  );
};

export default StoryCamera;
