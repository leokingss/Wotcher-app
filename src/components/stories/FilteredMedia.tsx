import { CSSProperties, forwardRef, ReactNode } from "react";
import {
  cssFilterAt,
  FilterPreset,
  overlayStrength,
} from "@/lib/storyFilters";
import StoryParticles from "./StoryParticles";

interface FilteredMediaProps {
  preset: FilterPreset;
  intensity: number;
  className?: string;
  /** Aspect-ratio class on the wrapper. */
  aspectClass?: string;
  /** The <img> or <video> the filter applies to. */
  children: ReactNode;
  /** Extra elements rendered above overlays (e.g. caption stickers). */
  topLayer?: ReactNode;
  /** Disable particle rendering (e.g. for static thumbnails). */
  noParticles?: boolean;
}

/**
 * Wraps any <img>/<video> child with the CSS filter and overlay layers
 * defined by the active preset. Mirrors what the camera bakes into video,
 * so live preview ≡ stored result.
 */
export const FilteredMedia = forwardRef<HTMLDivElement, FilteredMediaProps>(
  (
    { preset, intensity, className, aspectClass, children, topLayer, noParticles },
    ref,
  ) => {
    const t = overlayStrength(intensity);
    const filterStyle: CSSProperties = {
      filter: cssFilterAt(preset, intensity),
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    };

    const tintOpacity = preset.tint ? preset.tint.opacity * t : 0;
    const vignetteAlpha = preset.vignette ? preset.vignette * t : 0;
    const grainAlpha = preset.grain ? preset.grain * t : 0;
    const bloomAlpha = preset.bloom ? preset.bloom * t : 0;

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${aspectClass ?? ""} ${className ?? ""}`}
      >
        {/* The actual media — child must be <img>/<video>. We inject filter via style. */}
        <div className="absolute inset-0" style={filterStyle as CSSProperties}>
          {children}
        </div>

        {/* Tint */}
        {preset.tint && tintOpacity > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: preset.tint.color,
              opacity: tintOpacity,
              mixBlendMode: preset.tint.blend ?? "soft-light",
            }}
          />
        )}

        {/* Bloom (soft white-ish glow with screen blend) */}
        {bloomAlpha > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.6), transparent 70%)",
              opacity: bloomAlpha * 0.6,
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Grain — animated noise via SVG turbulence */}
        {grainAlpha > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: grainAlpha,
              mixBlendMode: "overlay",
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>")`,
              backgroundSize: "160px 160px",
            }}
          />
        )}

        {/* Vignette */}
        {vignetteAlpha > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: `inset 0 0 ${80 + vignetteAlpha * 120}px ${20 + vignetteAlpha * 80}px rgba(0,0,0,${vignetteAlpha * 0.85})`,
            }}
          />
        )}

        {/* Particles */}
        {!noParticles && preset.particles && t > 0 && (
          <StoryParticles kind={preset.particles} intensity={t} />
        )}

        {topLayer}
      </div>
    );
  },
);
FilteredMedia.displayName = "FilteredMedia";

export default FilteredMedia;
