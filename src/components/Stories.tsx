import { Plus, Music, Camera } from "lucide-react";
import { stories } from "@/data/mockSocial";

// Animated Music icon (profile page style)
const MusicIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <Music
        className={muted ? "" : "story-icon-jiggle"}
        style={{ color, width: 22, height: 22 }}
      />
    </div>
  );
};

// Animated Camera icon with flashing bulb effect
const CameraIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <Camera
        className={muted ? "" : "story-icon-flash"}
        style={{ color, width: 22, height: 22 }}
      />
    </div>
  );
};

// Animated Video icon — custom SVG video camera with a pulsing red REC dot
// and expanding broadcast rings.
const VideoIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <div className="relative" style={{ width: 22, height: 22 }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          style={{ color, position: "relative", zIndex: 1 }}
        >
          {/* Camera body */}
          <rect x="1" y="5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          {/* Lens housing */}
          <path
            d="M14 8L20 5.5V16.5L14 14Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Viewfinder bump */}
          <rect x="5" y="2.5" width="5" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          {/* REC dot */}
          {!muted && (
            <circle cx="16.5" cy="4" r="2" fill="#ef4444" className="video-rec-dot" />
          )}
        </svg>
      </div>
    </div>
  );
};

const StoryMediaIndicator = ({
  mediaType,
  muted,
}: {
  mediaType: "music" | "photo" | "video";
  muted: boolean;
}) => {
  if (mediaType === "photo") return <CameraIconAnim muted={muted} />;
  if (mediaType === "video") return <VideoIconAnim muted={muted} />;
  return <MusicIconAnim muted={muted} />;
};

const Stories = () => {
  return (
    <div className="py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-start px-4 py-4">
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
