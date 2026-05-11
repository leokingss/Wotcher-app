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
    <div className="flex items-end justify-center gap-[2px] h-4 mt-1.5">
      {base.map((h, i) => {
        const wobble = muted ? 0 : Math.sin((phase + i) * 0.9) * 0.15;
        const height = Math.max(0.18, Math.min(1, h + wobble));
        return (
          <div
            key={i}
            className="w-[2px] rounded-full transition-[height] duration-200"
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

// Photo: tiny camera with a flashing bulb
const PhotoStack = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  const flash = muted ? "hsl(var(--muted-foreground) / 0.6)" : "hsl(45, 100%, 75%)";
  return (
    <div className="relative h-4 mt-1.5 w-full flex items-center justify-center">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <rect
          x="1"
          y="0.5"
          width="2"
          height="1.5"
          rx="0.3"
          fill={flash}
          style={{ animation: muted ? "none" : "story-flash 1.4s ease-in-out infinite" }}
        />
        <rect x="0.5" y="2.5" width="15" height="9" rx="1.2" stroke={color} strokeWidth="1" fill="none" />
        <rect x="10" y="3.5" width="2" height="1" rx="0.2" fill={color} />
        <circle cx="8" cy="7.2" r="2.4" stroke={color} strokeWidth="0.9" fill="none" />
        <circle cx="8" cy="7.2" r="1" fill={color} opacity="0.8" />
      </svg>
    </div>
  );
};

// Video: tiny film reel rotating
const VideoStrip = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-4 mt-1.5 w-full flex items-center justify-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        style={{
          animation: muted ? "none" : "story-spin 2.4s linear infinite",
          filter: muted ? "none" : "drop-shadow(0 0 2px hsla(45,100%,55%,0.5))",
        }}
      >
        <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1" fill="none" />
        <circle cx="7" cy="7" r="1.2" fill={color} />
        <circle cx="7" cy="2.6" r="0.9" fill={color} />
        <circle cx="7" cy="11.4" r="0.9" fill={color} />
        <circle cx="2.6" cy="7" r="0.9" fill={color} />
        <circle cx="11.4" cy="7" r="0.9" fill={color} />
      </svg>
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
                  <StoryMediaIndicator
                    mediaType={story.mediaType ?? "music"}
                    seed={story.id}
                    muted={!!watched}
                  />
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
