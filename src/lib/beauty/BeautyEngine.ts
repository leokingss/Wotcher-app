import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  FACE_OVAL,
  LEFT_CHEEK,
  LEFT_EYE,
  MOUTH_INNER,
  RIGHT_CHEEK,
  RIGHT_EYE,
} from "./landmarks";

export interface BeautyParams {
  /** 0..100 — bilateral-style skin smoothing inside the face oval. */
  skinSmooth: number;
  /** 0..100 — brightens & adds catchlight inside the eye polygons. */
  eyeBrighten: number;
  /** 0..100 — desaturates & brightens inside the inner-mouth polygon. */
  teethWhiten: number;
  /** 0..100 — soft shadow along cheek/jaw to add definition. */
  contour: number;
}

export const BEAUTY_OFF: BeautyParams = {
  skinSmooth: 0,
  eyeBrighten: 0,
  teethWhiten: 0,
  contour: 0,
};

export const isBeautyActive = (p: BeautyParams) =>
  p.skinSmooth > 0 || p.eyeBrighten > 0 || p.teethWhiten > 0 || p.contour > 0;

/**
 * Lazy-loaded MediaPipe FaceLandmarker singleton. The model file (~3MB) is
 * fetched once from the official Google CDN; subsequent calls reuse the
 * instance. We expose `getLandmarker()` so callers can `await` initialisation
 * without blocking module load.
 */
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export const getLandmarker = (): Promise<FaceLandmarker> => {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })().catch((err) => {
      // Reset so a future call can retry (e.g. transient CDN failure).
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
};

/** Switch the singleton between IMAGE and VIDEO modes as needed. */
export const ensureMode = async (mode: "IMAGE" | "VIDEO") => {
  const lm = await getLandmarker();
  // setOptions is async on the API; using as any to avoid noisy types.
  await (lm as any).setOptions({ runningMode: mode });
  return lm;
};

const tracePolygon = (
  ctx: CanvasRenderingContext2D,
  pts: NormalizedLandmark[],
  indices: number[],
  w: number,
  h: number,
) => {
  ctx.beginPath();
  indices.forEach((idx, i) => {
    const p = pts[idx];
    if (!p) return;
    const x = p.x * w;
    const y = p.y * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
};

const polyCenter = (pts: NormalizedLandmark[], idx: number[]) => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const i of idx) {
    const p = pts[i];
    if (!p) continue;
    x += p.x;
    y += p.y;
    n += 1;
  }
  return n ? { x: x / n, y: y / n } : { x: 0.5, y: 0.5 };
};

/**
 * Apply beauty effects on top of an already-drawn canvas. The canvas should
 * contain the source image/frame (with any base CSS filter already applied).
 * We do not redraw the source — we composite extra layers using face
 * landmarks so beauty stacks on top of the colour grade.
 */
export const applyBeauty = (
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  result: FaceLandmarkerResult | null,
  params: BeautyParams,
  /** If true, the canvas was drawn mirrored (front camera) so landmarks must mirror too. */
  mirror = false,
) => {
  if (!isBeautyActive(params) || !result?.faceLandmarks?.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const face = result.faceLandmarks[0];

  // If mirrored, flip landmark x coordinates so polygons line up with what's
  // on screen. We work on a shallow clone to avoid mutating MediaPipe state.
  const lm: NormalizedLandmark[] = mirror
    ? face.map((p) => ({ ...p, x: 1 - p.x }))
    : face;

  // ── Skin smoothing ──────────────────────────────────────────────────────
  // Draw a blurred copy of the canvas, clipped to the face oval, on top of
  // itself. Strength controls blur radius and alpha so the user can dial it.
  if (params.skinSmooth > 0) {
    const t = params.skinSmooth / 100;
    const blurPx = 2 + t * 10; // 2 → 12px
    ctx.save();
    tracePolygon(ctx, lm, FACE_OVAL, w, h);
    ctx.clip();
    // Re-draw the canvas onto itself with a blur filter, multiplied by alpha.
    ctx.globalAlpha = 0.35 + t * 0.45; // 0.35 → 0.80
    // @ts-ignore — `filter` on 2d context is supported in modern browsers.
    ctx.filter = `blur(${blurPx.toFixed(2)}px)`;
    ctx.drawImage(source as any, 0, 0, w, h);
    // @ts-ignore
    ctx.filter = "none";
    ctx.restore();
  }

  // ── Eye brighten ────────────────────────────────────────────────────────
  if (params.eyeBrighten > 0) {
    const t = params.eyeBrighten / 100;
    [LEFT_EYE, RIGHT_EYE].forEach((eye) => {
      ctx.save();
      tracePolygon(ctx, lm, eye, w, h);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255,250,235,${0.18 + t * 0.32})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Soft white catch-light at the eye centre for sparkle.
      const c = polyCenter(lm, eye);
      const r = Math.min(w, h) * 0.012 * (0.6 + t);
      const g = ctx.createRadialGradient(c.x * w, c.y * h, 0, c.x * w, c.y * h, r * 3);
      g.addColorStop(0, `rgba(255,255,255,${0.5 * t})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x * w, c.y * h, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Teeth whiten ────────────────────────────────────────────────────────
  if (params.teethWhiten > 0) {
    const t = params.teethWhiten / 100;
    ctx.save();
    tracePolygon(ctx, lm, MOUTH_INNER, w, h);
    ctx.clip();
    // Brighten + desaturate by overlaying soft white in screen mode.
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,250,240,${0.18 + t * 0.42})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ── Soft contour ────────────────────────────────────────────────────────
  if (params.contour > 0) {
    const t = params.contour / 100;
    [LEFT_CHEEK, RIGHT_CHEEK].forEach((cheek) => {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = `rgba(60,40,30,${0.10 + t * 0.18})`;
      ctx.lineWidth = Math.min(w, h) * (0.012 + t * 0.012);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.filter = `blur(${4 + t * 6}px)`;
      ctx.beginPath();
      cheek.forEach((idx, i) => {
        const p = lm[idx];
        if (!p) return;
        const x = p.x * w;
        const y = p.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    });
  }
};
