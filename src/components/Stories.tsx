import { Plus, Music, Film, Camera } from "lucide-react";
import { stories } from "@/data/mockSocial";

// Animated Music icon (profile page style)
const MusicIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <Music
        className={muted ? "" : "story-icon-bounce"}
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

// Film icon rotated to landscape with vertical perforation scroll
const FilmIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <div className="relative" style={{ width: 28, height: 16 }}>
        <Film
          className={muted ? "" : "story-film-rotate"}
          style={{ color, width: 28, height: 16, position: "relative", zIndex: 1 }}
        />
        {!muted && (
          <>
            {/* Left perforation strip - scrolls vertically */}
            <div
              className="absolute top-[3px] bottom-[3px] left-[2px] w-[2px] overflow-hidden"
              style={{ zIndex: 0 }}
            >
              <div className="story-film-roll-v" />
            </div>
            {/* Right perforation strip - scrolls vertically */}
            <div
              className="absolute top-[3px] bottom-[3px] right-[2px] w-[2px] overflow-hidden"
              style={{ zIndex: 0 }}
            >
              <div className="story-film-roll-v" />
            </div>
          </>
        )}
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
  if (mediaType === "video") return <FilmIconAnim muted={muted} />;
  return <MusicIconAnim muted={muted} />;
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
