/**
 * AR face effects — Phase 3 of the Stories filter system.
 *
 * Each effect is a small Canvas2D renderer that uses MediaPipe FaceMesh
 * landmarks to anchor itself to the face. We deliberately render with
 * primitive shapes + emoji rather than 3D meshes so the whole pack works
 * everywhere a 2d canvas works (no WebGL required) and is recordable via
 * canvas.captureStream() for video stories.
 */
import type {
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { LEFT_EYE, RIGHT_EYE } from "@/lib/beauty/landmarks";

export type AREffectId =
  | "none"
  | "sunglasses"
  | "crown"
  | "cat-ears"
  | "bunny-ears"
  | "halo"
  | "devil-horns"
  | "heart-eyes"
  | "star-sparkle"
  | "blush";

export interface AREffectPreset {
  id: AREffectId;
  name: string;
  /** Short tagline shown in the carousel. */
  hint?: string;
  /** Emoji used as the carousel thumbnail (no asset pipeline required). */
  thumb: string;
  /** True if the effect needs `time` to animate (heart pulse, sparkle drift). */
  animated?: boolean;
}

export const AR_EFFECTS: AREffectPreset[] = [
  { id: "none", name: "None", thumb: "✨" },
  { id: "sunglasses", name: "Shades", thumb: "🕶️" },
  { id: "crown", name: "Crown", thumb: "👑", hint: "Royalty mode" },
  { id: "cat-ears", name: "Cat", thumb: "🐱" },
  { id: "bunny-ears", name: "Bunny", thumb: "🐰" },
  { id: "halo", name: "Halo", thumb: "😇", animated: true },
  { id: "devil-horns", name: "Devil", thumb: "😈" },
  { id: "heart-eyes", name: "Hearts", thumb: "💖", animated: true },
  { id: "star-sparkle", name: "Sparkle", thumb: "🌟", animated: true },
  { id: "blush", name: "Blush", thumb: "☺️" },
];

export const AR_NONE = AR_EFFECTS[0];

export const getAREffectById = (id: string | null | undefined): AREffectPreset =>
  AR_EFFECTS.find((e) => e.id === id) ?? AR_NONE;

export const isAREffectActive = (id: string | null | undefined) =>
  !!id && id !== "none";

// ── Geometry helpers ────────────────────────────────────────────────────────

interface Pt {
  x: number;
  y: number;
}

const polyCenter = (pts: NormalizedLandmark[], idx: number[]): Pt => {
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

interface FaceAnchors {
  leftEye: Pt;
  rightEye: Pt;
  /** Midpoint between eyes. */
  eyeMid: Pt;
  /** Forehead top landmark (idx 10). */
  forehead: Pt;
  chin: Pt;
  noseTip: Pt;
  mouthLeft: Pt;
  mouthRight: Pt;
  /** Distance between eye centres in canvas px (used as a scale unit). */
  eyeDist: number;
  /** Up-vector normal to the eye line (positive = above the head). */
  upX: number;
  upY: number;
  /** Right-vector along the eye line. */
  rightX: number;
  rightY: number;
  /** Tilt of the eye line in radians. */
  rotation: number;
}

const buildAnchors = (
  lm: NormalizedLandmark[],
  w: number,
  h: number,
): FaceAnchors => {
  const leftEye = polyCenter(lm, LEFT_EYE);
  const rightEye = polyCenter(lm, RIGHT_EYE);
  const lx = leftEye.x * w;
  const ly = leftEye.y * h;
  const rx = rightEye.x * w;
  const ry = rightEye.y * h;
  const eyeDist = Math.hypot(rx - lx, ry - ly) || w * 0.18;
  // Right-vector along eye line (left → right).
  let rxv = (rx - lx) / eyeDist;
  let ryv = (ry - ly) / eyeDist;
  // Up-vector perpendicular to the eye line, pointing up the head.
  const upX = ryv;
  const upY = -rxv;
  return {
    leftEye: { x: lx, y: ly },
    rightEye: { x: rx, y: ry },
    eyeMid: { x: (lx + rx) / 2, y: (ly + ry) / 2 },
    forehead: { x: (lm[10]?.x ?? 0.5) * w, y: (lm[10]?.y ?? 0.3) * h },
    chin: { x: (lm[152]?.x ?? 0.5) * w, y: (lm[152]?.y ?? 0.95) * h },
    noseTip: { x: (lm[1]?.x ?? 0.5) * w, y: (lm[1]?.y ?? 0.55) * h },
    mouthLeft: { x: (lm[61]?.x ?? 0.4) * w, y: (lm[61]?.y ?? 0.75) * h },
    mouthRight: { x: (lm[291]?.x ?? 0.6) * w, y: (lm[291]?.y ?? 0.75) * h },
    eyeDist,
    upX,
    upY,
    rightX: rxv,
    rightY: ryv,
    rotation: Math.atan2(ry - ly, rx - lx),
  };
};

// ── Renderers ───────────────────────────────────────────────────────────────

const drawSunglasses = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  const lensR = a.eyeDist * 0.55;
  const bridge = a.eyeDist * 0.18;

  ctx.save();
  ctx.translate(a.eyeMid.x, a.eyeMid.y);
  ctx.rotate(a.rotation);
  // Frame shadow
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  // Lenses (rounded rect-ish ellipse)
  const lensY = 0;
  const offset = a.eyeDist / 2;
  ctx.fillStyle = "rgba(15,15,18,0.92)";
  ctx.strokeStyle = "rgba(0,0,0,0.95)";
  ctx.lineWidth = lensR * 0.22;
  for (const cx of [-offset, offset]) {
    ctx.beginPath();
    ctx.ellipse(cx, lensY, lensR, lensR * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.shadowColor = "transparent";
  // Bridge
  ctx.lineWidth = lensR * 0.18;
  ctx.beginPath();
  ctx.moveTo(-offset + lensR * 0.85, 0);
  ctx.lineTo(offset - lensR * 0.85, 0);
  ctx.stroke();
  // Subtle white reflection on lens
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff";
  for (const cx of [-offset, offset]) {
    ctx.beginPath();
    ctx.ellipse(cx - lensR * 0.3, -lensR * 0.3, lensR * 0.32, lensR * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawCrown = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  // Anchor above the forehead by ~0.6× eyeDist along the up vector.
  const cx = a.forehead.x + a.upX * a.eyeDist * 0.55;
  const cy = a.forehead.y + a.upY * a.eyeDist * 0.55;
  const w = a.eyeDist * 1.9;
  const h = a.eyeDist * 0.95;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a.rotation);
  // Gold gradient
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, "#fff3b0");
  grad.addColorStop(0.5, "#f4c430");
  grad.addColorStop(1, "#a8761b");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(80,55,5,0.85)";
  ctx.lineWidth = h * 0.07;
  ctx.shadowColor = "rgba(244,196,48,0.55)";
  ctx.shadowBlur = h * 0.6;
  // Zig-zag crown shape: 5 points
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2, 0);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = -w / 2 + w * t;
    ctx.lineTo(x, -h / 2);
    if (i < 4) {
      const xn = -w / 2 + w * ((i + 0.5) / 4);
      ctx.lineTo(xn, -h / 6);
    }
  }
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = "transparent";
  // Gemstones at peak tips
  const gems = ["#e94560", "#3ec1d3", "#f0d78c", "#9b5de5", "#06d6a0"];
  for (let i = 0; i < 5; i++) {
    const x = -w / 2 + w * (i / 4);
    ctx.fillStyle = gems[i % gems.length];
    ctx.beginPath();
    ctx.arc(x, -h / 2 + h * 0.08, h * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawCatEars = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  const baseX = a.forehead.x + a.upX * a.eyeDist * 0.45;
  const baseY = a.forehead.y + a.upY * a.eyeDist * 0.45;
  const earH = a.eyeDist * 1.0;
  const earW = a.eyeDist * 0.7;
  const spread = a.eyeDist * 0.85;
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(a.rotation);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  for (const sign of [-1, 1]) {
    // Outer triangle
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(sign * spread - earW / 2, 0);
    ctx.lineTo(sign * spread + earW / 2, 0);
    ctx.lineTo(sign * spread, -earH);
    ctx.closePath();
    ctx.fill();
    // Inner pink
    ctx.fillStyle = "#ff8fb1";
    ctx.beginPath();
    ctx.moveTo(sign * spread - earW * 0.32, -earH * 0.15);
    ctx.lineTo(sign * spread + earW * 0.32, -earH * 0.15);
    ctx.lineTo(sign * spread, -earH * 0.78);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = "transparent";
  ctx.restore();

  // Whiskers + nose drawn in canvas space (rotation handled per stroke).
  ctx.save();
  ctx.translate(a.noseTip.x, a.noseTip.y);
  ctx.rotate(a.rotation);
  // Tiny pink nose
  ctx.fillStyle = "#ff6b9a";
  ctx.beginPath();
  ctx.ellipse(0, 0, a.eyeDist * 0.07, a.eyeDist * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // Whiskers
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(1, a.eyeDist * 0.018);
  ctx.lineCap = "round";
  for (const sign of [-1, 1]) {
    for (const dy of [-0.1, 0, 0.1]) {
      ctx.beginPath();
      ctx.moveTo(sign * a.eyeDist * 0.15, dy * a.eyeDist);
      ctx.lineTo(sign * a.eyeDist * 0.55, dy * a.eyeDist * 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
};

const drawBunnyEars = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  const baseX = a.forehead.x + a.upX * a.eyeDist * 0.5;
  const baseY = a.forehead.y + a.upY * a.eyeDist * 0.5;
  const earH = a.eyeDist * 1.9;
  const earW = a.eyeDist * 0.4;
  const spread = a.eyeDist * 0.55;
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(a.rotation);
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 12;
  for (const sign of [-1, 1]) {
    // Outer ear (white/cream, slightly tilted outward).
    ctx.save();
    ctx.translate(sign * spread, 0);
    ctx.rotate(sign * 0.18);
    ctx.fillStyle = "#fbf6ee";
    ctx.beginPath();
    ctx.ellipse(0, -earH / 2, earW / 2, earH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner ear pink
    ctx.fillStyle = "#ffb2c8";
    ctx.beginPath();
    ctx.ellipse(0, -earH / 2, earW * 0.28, earH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

const drawHalo = (
  ctx: CanvasRenderingContext2D,
  a: FaceAnchors,
  time: number,
) => {
  const cx = a.forehead.x + a.upX * a.eyeDist * 1.05;
  const cy = a.forehead.y + a.upY * a.eyeDist * 1.05;
  const rx = a.eyeDist * 1.4;
  const ry = a.eyeDist * 0.34;
  const pulse = 1 + Math.sin(time / 600) * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a.rotation);
  ctx.scale(pulse, 1);
  // Outer glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0, "rgba(255,243,176,0.0)");
  grad.addColorStop(0.6, "rgba(255,221,109,0.55)");
  grad.addColorStop(1, "rgba(255,221,109,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 1.25, ry * 2.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Halo ring
  ctx.lineWidth = ry * 0.45;
  ctx.strokeStyle = "rgba(255,215,90,0.95)";
  ctx.shadowColor = "rgba(255,215,90,0.9)";
  ctx.shadowBlur = ry * 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawDevilHorns = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  const baseX = a.forehead.x + a.upX * a.eyeDist * 0.35;
  const baseY = a.forehead.y + a.upY * a.eyeDist * 0.35;
  const hornH = a.eyeDist * 0.85;
  const hornW = a.eyeDist * 0.4;
  const spread = a.eyeDist * 0.7;
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(a.rotation);
  for (const sign of [-1, 1]) {
    const grad = ctx.createLinearGradient(0, 0, 0, -hornH);
    grad.addColorStop(0, "#5e0a16");
    grad.addColorStop(1, "#ff2230");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(255,30,55,0.6)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(sign * spread - hornW / 2, 0);
    ctx.quadraticCurveTo(
      sign * spread - hornW * 0.1,
      -hornH * 0.45,
      sign * (spread + hornW * 0.45),
      -hornH,
    );
    ctx.quadraticCurveTo(
      sign * (spread + hornW * 0.05),
      -hornH * 0.55,
      sign * spread + hornW / 2,
      0,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = "transparent";
  ctx.restore();
};

const drawHeartAt = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#ff3366",
) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(0, -10, -55, -10, -55, 25);
  ctx.bezierCurveTo(-55, 55, -25, 70, 0, 95);
  ctx.bezierCurveTo(25, 70, 55, 55, 55, 25);
  ctx.bezierCurveTo(55, -10, 0, -10, 0, 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawHeartEyes = (
  ctx: CanvasRenderingContext2D,
  a: FaceAnchors,
  time: number,
) => {
  const pulse = 1 + Math.sin(time / 320) * 0.12;
  const size = a.eyeDist * 0.55 * pulse;
  for (const eye of [a.leftEye, a.rightEye]) {
    drawHeartAt(ctx, eye.x, eye.y, size);
  }
};

const drawStarSparkle = (
  ctx: CanvasRenderingContext2D,
  a: FaceAnchors,
  time: number,
) => {
  // Procedural sparkles around the cheek/jaw region — deterministic per slot.
  const slots = 14;
  const baseR = a.eyeDist * 1.4;
  for (let i = 0; i < slots; i++) {
    const angle = (i / slots) * Math.PI * 2 + time / 1500;
    const wobble = Math.sin(time / 400 + i) * 0.4 + 1;
    const r = baseR * (0.85 + 0.25 * Math.sin(time / 700 + i * 1.3));
    const x = a.eyeMid.x + Math.cos(angle) * r;
    const y = a.eyeMid.y + Math.sin(angle) * r * 0.78 + a.eyeDist * 0.2;
    const s = a.eyeDist * 0.12 * wobble;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? "#fff7c2" : "#ffe27a";
    ctx.shadowColor = "#fff3a0";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let p = 0; p < 4; p++) {
      const a1 = (p / 4) * Math.PI * 2;
      const a2 = a1 + Math.PI / 4;
      ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
      ctx.lineTo(Math.cos(a2) * s * 0.35, Math.sin(a2) * s * 0.35);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

const drawBlush = (ctx: CanvasRenderingContext2D, a: FaceAnchors) => {
  const r = a.eyeDist * 0.52;
  // Cheek anchors: a bit below each eye, biased outward.
  const offsets: Pt[] = [
    { x: a.leftEye.x - a.rightX * a.eyeDist * 0.05, y: a.leftEye.y + a.eyeDist * 0.55 },
    { x: a.rightEye.x + a.rightX * a.eyeDist * 0.05, y: a.rightEye.y + a.eyeDist * 0.55 },
  ];
  for (const c of offsets) {
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    grad.addColorStop(0, "rgba(255,120,150,0.55)");
    grad.addColorStop(1, "rgba(255,120,150,0)");
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Tiny freckle dots
  ctx.fillStyle = "rgba(140,70,40,0.25)";
  for (const c of offsets) {
    for (let i = 0; i < 6; i++) {
      const dx = (Math.random() - 0.5) * a.eyeDist * 0.4;
      const dy = (Math.random() - 0.5) * a.eyeDist * 0.25;
      ctx.beginPath();
      ctx.arc(c.x + dx, c.y + dy, Math.max(1, a.eyeDist * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Composite the active AR effect on top of the canvas using face landmarks.
 * No-op if `effectId` is "none" / unknown or no face is detected. Mirrors
 * landmark x coords when the canvas was drawn mirrored (front camera).
 */
export const applyAREffect = (
  canvas: HTMLCanvasElement,
  result: FaceLandmarkerResult | null,
  effectId: AREffectId | string | null | undefined,
  mirror = false,
  time: number = performance.now(),
) => {
  if (!isAREffectActive(effectId)) return;
  if (!result?.faceLandmarks?.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  const lm: NormalizedLandmark[] = mirror
    ? result.faceLandmarks[0].map((p) => ({ ...p, x: 1 - p.x }))
    : result.faceLandmarks[0];
  const a = buildAnchors(lm, w, h);

  switch (effectId) {
    case "sunglasses":
      drawSunglasses(ctx, a);
      break;
    case "crown":
      drawCrown(ctx, a);
      break;
    case "cat-ears":
      drawCatEars(ctx, a);
      break;
    case "bunny-ears":
      drawBunnyEars(ctx, a);
      break;
    case "halo":
      drawHalo(ctx, a, time);
      break;
    case "devil-horns":
      drawDevilHorns(ctx, a);
      break;
    case "heart-eyes":
      drawHeartEyes(ctx, a, time);
      break;
    case "star-sparkle":
      drawStarSparkle(ctx, a, time);
      break;
    case "blush":
      drawBlush(ctx, a);
      break;
    default:
      break;
  }
};
