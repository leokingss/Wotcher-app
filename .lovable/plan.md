# Stories Filters & Effects — Phased Plan

Your spec covers ~6 months of work for a full team (face tracking, AR, TensorFlow.js, GPU shaders, marketplace AR, admin moderation, creator filters). I want to ship something **real and great** rather than a shallow version of everything. Below is a phased plan; please confirm or adjust.

## Phase 1 — Core Filters + Camera UX (ship now)

**Filter engine**
- WebGL2 color-grading engine using fragment shaders (LUT-style + parametric grade)
- Real-time preview on camera stream and uploaded photo/video
- Intensity slider (0–100), filter carousel, swipe to change, smooth crossfade
- "Save favorite" + "last used" via Lovable Cloud (per user)

**Cinematic preset pack (10 looks)**
Monaco Gold, Tokyo Nights, Noir Street, Sunset Film, Midnight Blue, Soft Vintage, Dream Fade, Neon Glow, Luxe Black, Warm Grain — each tuned with curves, split-tone, grain, vignette, bloom.

**Trending pack (CSS/Canvas-doable)**
VHS, disposable, Y2K, cyberpunk glow, fisheye, glitch, old-money mono, luxury mono, paparazzi flash.

**Environment overlays (Canvas particles, no AR)**
Snow, rain, sparkles, embers, fog — composited over media.

**Camera UX**
- Vertical fullscreen camera modal
- Front/rear switch, flash toggle, tap-to-focus, pinch zoom, hold-to-record (max 20s), timer (3s/10s)
- Swipe horizontally between filters (Instagram-style)

**Creation tools (basics)**
- Text overlays (draggable, font/color/size)
- Emoji stickers (draggable, scalable, rotatable)
- Drawing tool (canvas pen, color picker)
- Layered, exportable to flattened image/video

**Storage**
- New table `story_filters` (preset registry + usage analytics)
- New table `user_favorite_filters`
- Extend `stories` with `filter_id`, `filter_intensity`, `overlays_json`

## Phase 2 — Beauty + AI smart filters (next)
- MediaPipe FaceMesh for skin smoothing, eye brighten, teeth whiten, soft contour
- AI auto-enhance (low-light correction, sky boost, portrait blur via segmentation)
- Background blur via MediaPipe Selfie Segmentation

## Phase 3 — AR face filters (later)
- Glasses, crowns, masks, animated makeup using FaceMesh landmarks
- WebGL2 + Three.js overlay layer

## Phase 4 — Polls, GIFs, music, marketplace product modes, admin moderation, creator-made filters
Each is a meaningful feature on its own.

---

## What I'll build right now if you approve

1. `src/lib/filters/` — WebGL2 filter engine (`FilterEngine.ts`), preset definitions, shader sources
2. `src/components/stories/StoryCamera.tsx` — fullscreen camera with filter carousel, controls, recording
3. `src/components/stories/FilterCarousel.tsx`, `IntensitySlider.tsx`, `OverlayEditor.tsx` (text/emoji/draw)
4. `src/components/stories/EnvironmentOverlay.tsx` — particle system (snow/rain/sparkles/embers/fog)
5. Wire into existing `StoryComposer.tsx` as the new capture/edit flow (uploads still work)
6. Migration: `story_filters`, `user_favorite_filters`, add columns to `stories`
7. Edge function not needed for Phase 1 (all client-side); analytics via direct insert

## Technical notes
- WebGL2 with a single quad, swappable fragment shader per filter, uniform-driven intensity
- LUT support via 2D atlas texture for cinematic looks (compact, fast)
- Video recording via `MediaRecorder` of a `<canvas>` `captureStream()` so filters bake into the export
- Particles: lightweight Canvas2D system, capped at 200 particles, paused when offscreen
- Mobile-first; respects `prefers-reduced-motion`; falls back to CSS filters if WebGL2 unavailable

## What I'm explicitly **not** doing in this turn (to avoid shipping a fake)
Face tracking / AR glasses & crowns, TensorFlow.js, AI auto-enhance, GIF picker, polls, music, marketplace product AR, admin moderation dashboard, creator filter SDK. I'll tackle these in dedicated follow-ups so each is real and tested.

---

**Reply "go" to ship Phase 1, or tell me which phase/feature to prioritise differently.**
