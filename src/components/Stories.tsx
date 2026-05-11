import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { stories } from "@/data/mockSocial";

// Deterministic pseudo-random heights per story so bars feel unique but stable
const seedBars = (seed: number, count = 7) => {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(0.35 + (s / 233280) * 0.65);
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

// Photo: stacked photo frames with a subtle shimmer sweep
const PhotoStack = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.45)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center overflow-hidden">
      <div className="relative w-8 h-5">
        <div
          className="absolute inset-0 rounded-[3px] -rotate-[10deg] -translate-x-[3px]"
          style={{ border: `1.2px solid ${color}`, opacity: 0.5 }}
        />
        <div
          className="absolute inset-0 rounded-[3px] rotate-[8deg] translate-x-[3px]"
          style={{ border: `1.2px solid ${color}`, opacity: 0.7 }}
        />
        <div
          className="absolute inset-0 rounded-[3px] flex items-center justify-center overflow-hidden"
          style={{ border: `1.4px solid ${color}` }}
        >
          <div className="w-1 h-1 rounded-full" style={{ background: color }} />
          {!muted && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(110deg, transparent 35%, hsla(45,100%,80%,0.6) 50%, transparent 65%)",
                backgroundSize: "220% 100%",
                animation: "story-shimmer 2.2s linear infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Video: scrolling film strip with a centered play triangle
const VideoStrip = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.5)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-x-2 h-4 rounded-[2px] overflow-hidden"
        style={{ border: `1px solid ${color}`, opacity: muted ? 0.55 : 0.9 }}
      >
        <div
          className="flex gap-[3px] h-full items-center px-[2px] w-[200%]"
          style={{ animation: muted ? "none" : "story-strip 1.6s linear infinite" }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-[1px] flex-shrink-0"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
      <div
        className="relative z-10"
        style={{
          width: 0,
          height: 0,
          borderLeft: `5px solid ${muted ? "hsl(var(--muted-foreground) / 0.75)" : "hsl(10,100%,55%)"}`,
          borderTop: "3.5px solid transparent",
          borderBottom: "3.5px solid transparent",
          filter: muted ? "none" : "drop-shadow(0 0 3px hsla(45,100%,55%,0.6))",
        }}
      />
    </div>
  );
};

const StoryMediaIndicator = ({
  mediaType,
  seed,
  muted,
}: {
  mediaType: "music" | "photo" | "video";
  seed: number;
  muted: boolean;
}) => {
  if (mediaType === "photo") return <PhotoStack muted={muted} />;
  if (mediaType === "video") return <VideoStrip muted={muted} />;
  return <WaveStrand seed={seed} muted={muted} />;
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
                  <div className="w-[72px] h-[112px] rounded-full neo-card-inset flex flex-col items-center justify-center">
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
                    watched ? "neo-card-inset opacity-60" : "neo-button-icon"
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
