import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Camera } from "lucide-react";
import { stories as baseStories, type StoryItem } from "@/data/mockSocial";
import StoryViewer from "./StoryViewer";
import StoryComposer from "./StoryComposer";
import { useAuth } from "@/hooks/useAuth";

const WATCHED_KEY = "watcher:watched-stories";
const loadWatched = (): number[] => {
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) ?? "[]"); } catch { return []; }
};
const saveWatched = (ids: number[]) => {
  try { localStorage.setItem(WATCHED_KEY, JSON.stringify(ids)); } catch {}
};

const MY_STORIES_KEY = (uid: string) => `watcher:my-stories:${uid}`;
const loadMyStories = (uid: string): StoryItem[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(MY_STORIES_KEY(uid)) ?? "[]");
    return raw
      .filter((s: any) => Array.isArray(s.frames) && s.frames.length > 0)
      .map((s: any) => ({
        id: s.id,
        username: s.username ?? "You",
        avatar: s.avatar,
        hasStory: true,
        mediaType: s.mediaType ?? "photo",
        frames: s.frames,
      })) as StoryItem[];
  } catch {
    return [];
  }
};

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchedIds, setWatchedIds] = useState<number[]>(() => loadWatched());
  const [openId, setOpenId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);

  // Load + listen for changes to my stories
  useEffect(() => {
    if (!user) { setMyStories([]); return; }
    const refresh = () => setMyStories(loadMyStories(user.id));
    refresh();
    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === MY_STORIES_KEY(user.id)) refresh();
    };
    window.addEventListener("watcher:my-stories-changed", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("watcher:my-stories-changed", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  useEffect(() => { saveWatched(watchedIds); }, [watchedIds]);

  // Build the displayed list: own stories first, then others
  const otherStories = baseStories
    .filter((s) => !s.isOwn)
    .map((s) => ({ ...s, watched: s.watched || watchedIds.includes(s.id) }));

  const handleOpen = (id: number) => setOpenId(id);
  const handleWatched = (id: number) =>
    setWatchedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const handleAddClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setComposerOpen(true);
  };

  const hasOwnStories = myStories.length > 0;
  const ownAvatar = myStories[0]?.avatar;
  const combinedListForViewer: StoryItem[] = [...myStories, ...otherStories];

  return (
    <div className="pt-1 pb-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-start px-4 pt-2 pb-4">
          {/* My Story tile */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => (hasOwnStories ? handleOpen(myStories[0].id) : handleAddClick())}
                className="w-[72px] h-[112px] rounded-full flex flex-col items-center pt-2 transition-transform active:scale-95 neo-button-icon"
                aria-label={hasOwnStories ? "View my story" : "Add story"}
              >
                {hasOwnStories ? (
                  <>
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(10,100%,55%)]">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                        <img
                          src={ownAvatar}
                          alt="My story"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <StoryMediaIndicator
                      mediaType={myStories[0].mediaType ?? "photo"}
                      muted={false}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="neo-button-icon w-10 h-10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                      Add
                    </span>
                  </div>
                )}
              </button>
              {hasOwnStories && (
                <button
                  onClick={handleAddClick}
                  className="absolute -bottom-1 -right-1 neo-button-icon w-7 h-7 rounded-full flex items-center justify-center bg-background border-2 border-background"
                  aria-label="Add another frame"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                </button>
              )}
            </div>
            <span className="text-xs text-foreground font-medium">My Story</span>
          </div>

          {/* Other people's stories */}
          {otherStories.map((story) => {
            const watched = story.watched;
            const hasFrames = (story.frames?.length ?? 0) > 0;
            return (
              <button
                key={story.id}
                onClick={() => hasFrames && handleOpen(story.id)}
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

      <StoryViewer
        list={combinedListForViewer}
        startId={openId ?? 0}
        open={openId !== null}
        onClose={() => setOpenId(null)}
        onWatched={handleWatched}
      />

      <StoryComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  );
};

export default Stories;
