/**
 * Story filter presets.
 *
 * Each filter is expressed as a `cssFilter` (used directly via the CSS
 * `filter` property — GPU-accelerated by browsers and works on both <img>
 * and <video>) plus optional overlays:
 *
 *  - `tint`   : a colour washed over the media at a given opacity / blend mode
 *  - `vignette`: darkening from the edges
 *  - `grain`  : film-grain noise overlay
 *  - `bloom`  : soft glow around highlights
 *
 * Intensity (0..1) is applied by lerping each effect's strength toward identity.
 *
 * Real-time preview, captured-video bake-in, and post-publish playback all
 * share these definitions so the user always sees the same look.
 */

export type FilterCategory = "cinematic" | "trending" | "environment" | "none";

export interface OverlayTint {
  color: string; // any CSS colour
  opacity: number; // 0..1 at full intensity
  blend?: React.CSSProperties["mixBlendMode"];
}

export interface FilterPreset {
  id: string;
  name: string;
  category: FilterCategory;
  /** CSS filter string at full intensity. */
  cssFilter: string;
  tint?: OverlayTint;
  /** Vignette darkness 0..1 at full intensity. */
  vignette?: number;
  /** Film-grain opacity 0..1 at full intensity. */
  grain?: number;
  /** Soft bloom around highlights 0..1. */
  bloom?: number;
  /** Optional environmental particle effect rendered above the media. */
  particles?: "snow" | "rain" | "sparkles" | "embers" | "fog";
  /** Short tag visible under the thumbnail. */
  tag?: string;
}

export const FILTER_NONE: FilterPreset = {
  id: "none",
  name: "Original",
  category: "none",
  cssFilter: "none",
};

export const FILTER_PRESETS: FilterPreset[] = [
  FILTER_NONE,

  // ── Cinematic ───────────────────────────────────────────────────────────
  {
    id: "monaco-gold",
    name: "Monaco Gold",
    category: "cinematic",
    cssFilter: "contrast(1.08) saturate(1.05) brightness(1.02) sepia(0.18) hue-rotate(-8deg)",
    tint: { color: "#f5c87a", opacity: 0.12, blend: "soft-light" },
    vignette: 0.35,
    grain: 0.08,
    tag: "Riviera",
  },
  {
    id: "tokyo-nights",
    name: "Tokyo Nights",
    category: "cinematic",
    cssFilter: "contrast(1.18) saturate(1.35) brightness(0.92) hue-rotate(-12deg)",
    tint: { color: "#ff2da8", opacity: 0.16, blend: "screen" },
    vignette: 0.45,
    bloom: 0.4,
    tag: "Neon",
  },
  {
    id: "noir-street",
    name: "Noir Street",
    category: "cinematic",
    cssFilter: "grayscale(1) contrast(1.35) brightness(0.92)",
    vignette: 0.55,
    grain: 0.18,
    tag: "B&W",
  },
  {
    id: "sunset-film",
    name: "Sunset Film",
    category: "cinematic",
    cssFilter: "contrast(1.05) saturate(1.1) brightness(1.02) sepia(0.25)",
    tint: { color: "#ff8a3d", opacity: 0.18, blend: "soft-light" },
    vignette: 0.3,
    grain: 0.1,
    tag: "Golden hour",
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    category: "cinematic",
    cssFilter: "contrast(1.12) brightness(0.9) saturate(0.85) hue-rotate(15deg)",
    tint: { color: "#1f4dff", opacity: 0.18, blend: "soft-light" },
    vignette: 0.4,
    tag: "Cool",
  },
  {
    id: "soft-vintage",
    name: "Soft Vintage",
    category: "cinematic",
    cssFilter: "contrast(0.92) saturate(0.85) brightness(1.05) sepia(0.22)",
    tint: { color: "#d4a373", opacity: 0.15, blend: "soft-light" },
    vignette: 0.25,
    grain: 0.12,
    tag: "70s",
  },
  {
    id: "dream-fade",
    name: "Dream Fade",
    category: "cinematic",
    cssFilter: "contrast(0.85) saturate(0.95) brightness(1.08)",
    tint: { color: "#ffd6f6", opacity: 0.18, blend: "screen" },
    bloom: 0.5,
    tag: "Hazy",
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    category: "cinematic",
    cssFilter: "contrast(1.25) saturate(1.6) brightness(0.98)",
    tint: { color: "#00f5d4", opacity: 0.1, blend: "screen" },
    bloom: 0.6,
    vignette: 0.3,
    tag: "Cyber",
  },
  {
    id: "luxe-black",
    name: "Luxe Black",
    category: "cinematic",
    cssFilter: "contrast(1.4) brightness(0.85) saturate(0.4)",
    vignette: 0.5,
    grain: 0.06,
    tag: "Editorial",
  },
  {
    id: "warm-grain",
    name: "Warm Grain",
    category: "cinematic",
    cssFilter: "contrast(1.05) saturate(1.05) brightness(1.02) sepia(0.12)",
    tint: { color: "#ffb47a", opacity: 0.1, blend: "soft-light" },
    grain: 0.22,
    vignette: 0.2,
    tag: "Analog",
  },

  // ── Trending ────────────────────────────────────────────────────────────
  {
    id: "vhs",
    name: "VHS Camcorder",
    category: "trending",
    cssFilter: "contrast(1.15) saturate(1.2) hue-rotate(-3deg) brightness(0.98)",
    tint: { color: "#3affb1", opacity: 0.06, blend: "screen" },
    vignette: 0.35,
    grain: 0.28,
    tag: "'94",
  },
  {
    id: "disposable",
    name: "Disposable",
    category: "trending",
    cssFilter: "contrast(1.1) saturate(1.15) brightness(1.04) sepia(0.08)",
    tint: { color: "#fff1c2", opacity: 0.08, blend: "soft-light" },
    grain: 0.14,
    vignette: 0.22,
    tag: "35mm",
  },
  {
    id: "y2k",
    name: "Y2K",
    category: "trending",
    cssFilter: "contrast(1.1) saturate(1.4) brightness(1.05) hue-rotate(-6deg)",
    tint: { color: "#a0c4ff", opacity: 0.14, blend: "screen" },
    bloom: 0.3,
    tag: "2001",
  },
  {
    id: "old-money",
    name: "Old Money",
    category: "trending",
    cssFilter: "contrast(1.1) saturate(0.7) brightness(1.0) sepia(0.18)",
    tint: { color: "#caa472", opacity: 0.1, blend: "soft-light" },
    vignette: 0.3,
    grain: 0.08,
    tag: "Aspen",
  },
  {
    id: "luxury-mono",
    name: "Luxury Mono",
    category: "trending",
    cssFilter: "grayscale(1) contrast(1.15) brightness(1.02)",
    vignette: 0.25,
    tag: "Vogue",
  },
  {
    id: "glitch",
    name: "Digital Glitch",
    category: "trending",
    cssFilter: "contrast(1.25) saturate(1.5) hue-rotate(8deg)",
    tint: { color: "#ff003c", opacity: 0.08, blend: "screen" },
    bloom: 0.35,
    tag: "404",
  },
  {
    id: "paparazzi",
    name: "Paparazzi",
    category: "trending",
    cssFilter: "contrast(1.3) brightness(1.18) saturate(0.85)",
    bloom: 0.55,
    vignette: 0.15,
    tag: "Flash",
  },

  // ── Environment ─────────────────────────────────────────────────────────
  {
    id: "snow",
    name: "Snowfall",
    category: "environment",
    cssFilter: "contrast(1.05) brightness(1.05) saturate(0.95)",
    tint: { color: "#cfe6ff", opacity: 0.06, blend: "screen" },
    particles: "snow",
    tag: "Winter",
  },
  {
    id: "rain",
    name: "Rain",
    category: "environment",
    cssFilter: "contrast(1.1) brightness(0.92) saturate(0.9)",
    tint: { color: "#94b4ff", opacity: 0.08, blend: "soft-light" },
    particles: "rain",
    tag: "Storm",
  },
  {
    id: "sparkles",
    name: "Sparkles",
    category: "environment",
    cssFilter: "contrast(1.05) saturate(1.1) brightness(1.02)",
    bloom: 0.3,
    particles: "sparkles",
    tag: "Magic",
  },
  {
    id: "embers",
    name: "Fire Embers",
    category: "environment",
    cssFilter: "contrast(1.08) saturate(1.15) brightness(0.98)",
    tint: { color: "#ff6a1a", opacity: 0.1, blend: "screen" },
    particles: "embers",
    vignette: 0.3,
    tag: "Glow",
  },
  {
    id: "fog",
    name: "Fog",
    category: "environment",
    cssFilter: "contrast(0.92) brightness(1.06) saturate(0.85)",
    tint: { color: "#e8eef5", opacity: 0.16, blend: "screen" },
    particles: "fog",
    tag: "Mist",
  },
];

export const getFilterById = (id: string | null | undefined): FilterPreset =>
  FILTER_PRESETS.find((p) => p.id === id) ?? FILTER_NONE;

/** Lerp a filter at a given intensity (0..100). 100 = full effect. */
export const cssFilterAt = (preset: FilterPreset, intensity: number): string => {
  if (preset.id === "none") return "none";
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  // Quick path for full intensity.
  if (t === 1) return preset.cssFilter;
  // Wrap the full filter in `opacity()` won't work; instead we tween numeric
  // values inside the filter string. We do this with a simple regex pass.
  return preset.cssFilter.replace(
    /(grayscale|sepia|contrast|saturate|brightness|hue-rotate)\(([-\d.]+)(deg)?\)/g,
    (_m, fn, val, unit) => {
      const n = Number(val);
      const identity =
        fn === "grayscale" || fn === "sepia"
          ? 0
          : fn === "hue-rotate"
            ? 0
            : 1; // contrast/saturate/brightness identity = 1
      const lerped = identity + (n - identity) * t;
      return `${fn}(${Number(lerped.toFixed(3))}${unit ?? ""})`;
    },
  );
};

/** Strength multiplier 0..1 used for tint/vignette/grain/bloom overlays. */
export const overlayStrength = (intensity: number) =>
  Math.max(0, Math.min(100, intensity)) / 100;
