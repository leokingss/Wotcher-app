import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { stories } from "@/data/mockSocial";

// Deterministic pseudo-random heights per story so bars feel unique but stable
const seedBars = (seed: number, count = 7) => {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(0.35 + (s / 233280) * 0.65); // 0.35 - 1.0
  }
  return out;
};

const WaveStrand = ({ seed, muted = false }: { seed: number; muted?: boolean }) => {
  const base = seedBars(seed);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (muted) return;
    const id = setInterval(() => setPhase((p) => p + 1), 220);
    return () => clearInterval(id);
  }, [muted]);

  return (
    <div className="flex items-end justify-center gap-[2px] h-7 mt-2">
      {base.map((h, i) => {
        const wobble = muted ? 0 : Math.sin((phase + i) * 0.9) * 0.15;
        const height = Math.max(0.18, Math.min(1, h + wobble));
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-[height] duration-200"
            style={{
              height: `${height * 100}%`,
              background: muted
                ? "hsl(var(--muted-foreground) / 0.35)"
                : "linear-gradient(to top, hsl(45,100%,50%), hsl(10,100%,55%))",
            }}
          />
        );
      })}
    </div>
  );
};

const Stories = () => {
  return (
    <div className="py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-2 pt-1">
          {stories.map((story) => {
            if (story.isOwn) {
              return (
                <button
                  key={story.id}
                  className="flex flex-col items-center gap-2 flex-shrink-0 group"
                >
                  <div className="w-[72px] h-[112px] rounded-full neo-inset flex flex-col items-center justify-center">
                    <div className="neo-button-icon w-10 h-10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                      Add
                    </span>
                  </div>
                  <span className="text-xs text-foreground font-medium">My Story</span>
                </button>
              );
            }

            const watched = story.watched;
            return (
              <button
                key={story.id}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={`w-[72px] h-[112px] rounded-full flex flex-col items-center pt-2 transition-transform active:scale-95 ${
                    watched ? "neo-inset opacity-60" : "neo-button-icon"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full p-[2px] ${
                      watched
                        ? "bg-muted-foreground/30"
                        : "bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(10,100%,55%)]"
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                      <img
                        src={story.avatar}
                        alt={story.username}
                        className={`w-full h-full object-cover ${watched ? "grayscale" : ""}`}
                      />
                    </div>
                  </div>
                  <WaveStrand seed={story.id} muted={watched} />
                </div>
                <span
                  className={`text-xs font-medium ${
                    watched ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {story.username}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stories;
