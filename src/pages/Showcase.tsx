import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneScene from "@/components/showcase/PhoneScene";
import { CHAPTERS, CHAPTER_SECONDS } from "@/components/showcase/chapters";

/**
 * Auto-playing 3D product demo: a floating device spins through real Wotcher
 * screens while a simulated finger taps and swipes, with feature callouts.
 * Purely presentational — no data, no interaction required.
 */
const Showcase = () => {
  const [index, setIndex] = useState(0);
  const prevRef = useRef(0);
  const startRef = useRef(performance.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const elapsed = (performance.now() - startRef.current) / 1000;

  useEffect(() => {
    if (elapsed >= CHAPTER_SECONDS) {
      prevRef.current = index;
      startRef.current = performance.now();
      setIndex((i) => (i + 1) % CHAPTERS.length);
    }
  }, [tick, elapsed, index]);

  const chapter = CHAPTERS[index];
  const progress = Math.min(1, elapsed / CHAPTER_SECONDS);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -left-32 bottom-0 h-[45vh] w-[45vh] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:flex-row lg:items-center lg:gap-10 lg:py-0">
        {/* copy */}
        <div className="order-2 flex-1 lg:order-1">
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
            prevIndex={prevRef.current}
            t={elapsed}
            turn={elapsed}
          />
        </div>
      </div>
    </div>
  );
};

export default Showcase;
