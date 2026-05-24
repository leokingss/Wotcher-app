import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  applyBeauty,
  BeautyParams,
  ensureMode,
  isBeautyActive,
} from "@/lib/beauty/BeautyEngine";
import {
  applyAREffect,
  isAREffectActive,
  type AREffectId,
} from "@/lib/ar/arEffects";
import {
  cssFilterAt,
  FilterPreset,
  overlayStrength,
} from "@/lib/storyFilters";

export interface BeautyPhotoCanvasHandle {
  /** Capture the current canvas as a JPEG blob (for upload bake-in). */
  toBlob: (quality?: number) => Promise<Blob | null>;
}

interface Props {
  src: string;
  preset: FilterPreset;
  intensity: number;
  beauty: BeautyParams;
  arEffectId?: AREffectId | string;
  className?: string;
}

/**
 * Renders a single photo with the active CSS filter baked into a canvas and
 * the beauty pack composited on top using MediaPipe FaceLandmarker (IMAGE
 * mode). Used inside the story composer so what the user sees == what gets
 * uploaded.
 */
export const BeautyPhotoCanvas = forwardRef<BeautyPhotoCanvasHandle, Props>(
  ({ src, preset, intensity, beauty, arEffectId, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useImperativeHandle(ref, () => ({
      toBlob: (quality = 0.92) =>
        new Promise<Blob | null>((resolve) => {
          const c = canvasRef.current;
          if (!c) return resolve(null);
          c.toBlob((b) => resolve(b), "image/jpeg", quality);
        }),
    }));

    // Re-render whenever the inputs change.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Load the image once per `src`.
        let img = imgRef.current;
        if (!img || img.src !== src) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          await new Promise<void>((res, rej) => {
            img!.onload = () => res();
            img!.onerror = () => rej(new Error("image load failed"));
          });
          imgRef.current = img;
        }
        if (cancelled) return;

        const w = img.naturalWidth || 1080;
        const h = img.naturalHeight || 1920;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1) Base colour grade.
        // @ts-ignore
        ctx.filter = cssFilterAt(preset, intensity);
        ctx.drawImage(img, 0, 0, w, h);
        // @ts-ignore
        ctx.filter = "none";

        // 2) Filter overlays (tint / vignette).
        const t = overlayStrength(intensity);
        if (preset.tint) {
          ctx.save();
          ctx.globalAlpha = preset.tint.opacity * t;
          ctx.globalCompositeOperation =
            (preset.tint.blend === "screen" ? "screen" : "soft-light") as GlobalCompositeOperation;
          ctx.fillStyle = preset.tint.color;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
        if (preset.vignette) {
          const va = preset.vignette * t;
          const grad = ctx.createRadialGradient(
            w / 2,
            h / 2,
            Math.min(w, h) * 0.35,
            w / 2,
            h / 2,
            Math.max(w, h) * 0.7,
          );
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, `rgba(0,0,0,${va * 0.85})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        // 3) Beauty + AR via face landmarks.
        const needsFace = isBeautyActive(beauty) || isAREffectActive(arEffectId);
        if (needsFace) {
          try {
            const lm = await ensureMode("IMAGE");
            if (cancelled) return;
            const result = lm.detect(img);
            if (isBeautyActive(beauty)) {
              applyBeauty(canvas, canvas, result, beauty, false);
            }
            if (isAREffectActive(arEffectId)) {
              applyAREffect(canvas, result, arEffectId, false);
            }
          } catch (e) {
            console.error("Face detect failed", e);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [src, preset, intensity, beauty, arEffectId]);

    return <canvas ref={canvasRef} className={className} />;
  },
);
BeautyPhotoCanvas.displayName = "BeautyPhotoCanvas";

export default BeautyPhotoCanvas;
