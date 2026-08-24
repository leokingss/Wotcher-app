import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import PhoneScene from "@/components/showcase/PhoneScene";
import { CHAPTERS, CHAPTER_SECONDS } from "@/components/showcase/chapters";
import { ShowcaseAudio } from "@/lib/showcaseAudio";
import wotcherLogoIcon from "@/assets/wotcher-logo-icon.png";

/**
 * Auto-playing 3D product demo: logo + manifesto cold open, a floating device
 * that spins through real Wotcher screens while a simulated finger taps and
 * swipes, then a logo lock-up outro. Purely presentational.
 */
const INTRO = 6.2;
const OUTRO = 5.4;
const TOUR = CHAPTERS.length * CHAPTER_SECONDS;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

type CueName = "intro" | "impact" | "transition" | "tabOpen" | "tabSwitch" | "tap" | "outro";

/** Absolute timeline of audio cues, mirroring the on-screen choreography. */
const buildCues = () => {
  const cues: { at: number; name: CueName }[] = [{ at: 2.6, name: "intro" }];
  cues.push({ at: INTRO, name: "impact" });
  CHAPTERS.forEach((c, i) => {
    const c0 = INTRO + i * CHAPTER_SECONDS;
    if (i > 0) cues.push({ at: c0 - 0.4, name: "transition" });
    c.taps.forEach((tap) => cues.push({ at: c0 + tap.at, name: "tap" }));
  });
  // feed chapter: tab expansion + the two mode switches
  cues.push({ at: INTRO + 1.0, name: "tabOpen" });
  cues.push({ at: INTRO + 2.3, name: "tabSwitch" });
  cues.push({ at: INTRO + 3.5, name: "tabSwitch" });
  cues.push({ at: INTRO + TOUR, name: "outro" });
  return cues.sort((a, b) => a.at - b.at);
};

const Showcase = () => {
  const bootRef = useRef(performance.now());
  const [, setTick] = useState(0);
  const [sound, setSound] = useState(false);

  const audioRef = useRef<ShowcaseAudio | null>(null);
  if (!audioRef.current) audioRef.current = new ShowcaseAudio();
  const cues = useMemo(buildCues, []);
  const cursor = useRef(0);
  const chordRef = useRef(-1);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = (performance.now() - bootRef.current) / 1000;
      const audio = audioRef.current;
      while (cursor.current < cues.length && cues[cursor.current].at <= now) {
        const cue = cues[cursor.current];
        // only fire cues that are actually due now (skip backlog after unmute)
        if (audio?.active && now - cue.at < 0.4) audio.cue(cue.name);
        cursor.current += 1;
      }
      if (audio?.active) {
        const ci = Math.floor((now - INTRO) / CHAPTER_SECONDS);
        if (ci >= 0 && ci < CHAPTERS.length && ci !== chordRef.current) {
          chordRef.current = ci;
          audio.setChord(ci);
        }
      }
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cues]);

  useEffect(() => () => audioRef.current?.stop(), []);

  const toggleSound = useCallback(async () => {
    const audio = audioRef.current!;
    if (audio.active) {
      audio.stop();
      setSound(false);
    } else {
      await audio.start();
      setSound(true);
    }
  }, []);


  const total = (performance.now() - bootRef.current) / 1000;
  const tourT = total - INTRO;
  const phase = tourT < 0 ? "intro" : tourT < TOUR ? "tour" : "outro";

  const index = Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(tourT / CHAPTER_SECONDS)));
  const prevIndex = Math.max(0, index - 1);
  const elapsed = phase === "tour" ? tourT - index * CHAPTER_SECONDS : 0;
  const chapter = CHAPTERS[index];
  const progress = clamp01(elapsed / CHAPTER_SECONDS);

  // Device flies in as the manifesto dissolves, and warps away for the outro.
  const entry = clamp01((total - (INTRO - 1.6)) / 1.6);
  const exit = clamp01((total - (INTRO + TOUR - 0.6)) / 1.4);

  // Intro choreography
  const logoIn = clamp01(total / 1.1);
  const lineIn = clamp01((total - 1.4) / 1.1);
  const introOut = clamp01((total - (INTRO - 1.5)) / 1.5);

  const outroT = total - (INTRO + TOUR);
  const outroIn = clamp01(outroT / 1.2);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* sound toggle */}
      <button
        onClick={toggleSound}
        aria-label={sound ? "Mute soundtrack" : "Play soundtrack"}
        className="neo-button-icon absolute right-5 top-5 z-40 flex h-11 w-11 items-center justify-center rounded-full"
      >
        {sound ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* atmosphere */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -left-32 bottom-0 h-[45vh] w-[45vh] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* ── cold open ─────────────────────────────────────────── */}
      {phase === "intro" && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
          style={{
            opacity: 1 - introOut,
            transform: `scale(${1 + introOut * 0.35})`,
            filter: `blur(${introOut * 14}px)`,
          }}
        >
          <img
            src={wotcherLogoIcon}
            alt="Wotcher"
            className="h-28 w-auto select-none lg:h-36"
            style={{
              opacity: logoIn,
              transform: `scale(${0.7 + logoIn * 0.3}) translateY(${(1 - logoIn) * 24}px)`,
              filter: `drop-shadow(0 24px 60px rgba(0,0,0,.65)) drop-shadow(0 0 40px hsl(var(--primary)/${0.35 * logoIn}))`,
            }}
          />
          <h1
            className="mt-10 max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight lg:text-5xl"
            style={{
              opacity: lineIn,
              transform: `translateY(${(1 - lineIn) * 18}px)`,
              filter: `blur(${(1 - lineIn) * 8}px)`,
            }}
          >
            Others decide what you see.{" "}
            <span className="text-signature">We let you decide.</span>
          </h1>
          <div
            className="mt-10 h-[2px] rounded-full bg-signature"
            style={{ width: `${lineIn * 220}px`, opacity: lineIn * 0.8 }}
          />
        </div>
      )}

      {/* ── outro ─────────────────────────────────────────────── */}
      {phase === "outro" && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
          style={{ opacity: outroIn }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[46vh] w-[46vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[110px]"
            style={{ transform: `translate(-50%,-50%) scale(${0.6 + outroIn * 0.6})` }}
          />
          <img
            src={wotcherLogoIcon}
            alt="Wotcher"
            className="relative h-24 w-auto select-none lg:h-32"
            style={{
              transform: `scale(${0.86 + outroIn * 0.14}) rotate(${(1 - outroIn) * -8}deg)`,
              filter: "drop-shadow(0 20px 50px rgba(0,0,0,.6))",
            }}
          />
          <p className="watcher-logo relative mt-6 text-4xl lg:text-6xl">Wotcher</p>
          <p
            className="relative mt-4 text-sm uppercase tracking-[0.4em] text-muted-foreground"
            style={{ opacity: clamp01((outroT - 1.1) / 1.2) }}
          >
            Your feed. Your rules.
          </p>
        </div>
      )}

      <div
        className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:flex-row lg:items-center lg:gap-10 lg:py-0"
        style={{ opacity: phase === "tour" ? 1 : 0.001 + entry * (1 - exit) * 0.9 }}
      >
        {/* copy */}
        <div className="order-2 flex-1 lg:order-1" style={{ opacity: phase === "tour" ? 1 : 0 }}>
          <p className="watcher-logo mb-6">Wotcher</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={chapter.kicker}
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="neo-button inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {chapter.kicker}
              </span>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight lg:text-6xl">
                {chapter.title}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                {chapter.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* chapter rail */}
          <div className="mt-10 flex max-w-md gap-2">
            {CHAPTERS.map((c, i) => (
              <div key={c.kicker} className="neo-card-inset h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-signature"
                  style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")} —
            live product tour
          </p>
        </div>

        {/* device */}
        <div className="order-1 h-[58vh] w-full flex-1 lg:order-2 lg:h-screen">
          <PhoneScene
            index={index}
            prevIndex={prevIndex}
            t={elapsed}
            turn={elapsed}
            entry={entry}
            exit={exit}
          />
        </div>
      </div>
    </div>
  );
};

export default Showcase;
