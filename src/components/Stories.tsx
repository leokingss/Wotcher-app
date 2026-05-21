import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Camera } from "lucide-react";
import { type StoryItem } from "@/data/mockSocial";
import StoryViewer from "./StoryViewer";
import StoryComposer from "./StoryComposer";
import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";

const WATCHED_KEY = "watcher:watched-stories";
const loadWatched = (): string[] => {
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) ?? "[]"); } catch { return []; }
};
const saveWatched = (ids: string[]) => {
  try { localStorage.setItem(WATCHED_KEY, JSON.stringify(ids)); } catch {}
};

const MusicIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <Music className={muted ? "" : "story-icon-jiggle"} style={{ color, width: 22, height: 22 }} />
    </div>
  );
};

const CameraIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <Camera className={muted ? "" : "story-icon-flash"} style={{ color, width: 22, height: 22 }} />
    </div>
  );
};

const VideoIconAnim = ({ muted = false }: { muted?: boolean }) => {
  const color = muted ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(45, 100%, 50%)";
  return (
    <div className="relative h-7 mt-2 w-full flex items-center justify-center">
      <div className="relative" style={{ width: 22, height: 22 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color, position: "relative", zIndex: 1 }}>
          <rect x="1" y="5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 8L20 5.5V16.5L14 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="5" y="2.5" width="5" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          {!muted && <circle cx="16.5" cy="4" r="2" fill="#ef4444" className="video-rec-dot" />}
        </svg>
      </div>
    </div>
  );
};

const StoryMediaIndicator = ({ mediaType, muted }: { mediaType: "music" | "photo" | "video"; muted: boolean }) => {
  if (mediaType === "photo") return <CameraIconAnim muted={muted} />;
  if (mediaType === "video") return <VideoIconAnim muted={muted} />;
  return <MusicIconAnim muted={muted} />;
};

const Stories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stories: grouped, markViewed } = useStories();
  const [watchedIds, setWatchedIds] = useState<string[]>(() => loadWatched());
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => { saveWatched(watchedIds); }, [watchedIds]);

  // Convert grouped stories → StoryItem[] used by StoryViewer (numeric id = index)
  const viewerList: StoryItem[] = grouped.map((g, i) => ({
    id: i,
    username: g.username,
    avatar: g.avatar ?? "",
    isOwn: g.isOwn,
    hasStory: true,
    mediaType: g.mediaType,
    watched: watchedIds.includes(g.user_id),
    frames: g.frames.map((f) => ({
      url: f.media_url,
      caption: f.caption ?? undefined,
      trackTitle: f.track_title ?? undefined,
      trackArtist: f.track_artist ?? undefined,
    })),
  }));

  const own = grouped.find((g) => g.isOwn);
  const others = grouped.filter((g) => !g.isOwn);

  const handleAddClick = () => {
    if (!user) { navigate("/auth"); return; }
    setComposerOpen(true);
  };

  const handleOpen = (groupIndex: number) => {
    setOpenIdx(groupIndex);
    const g = grouped[groupIndex];
    if (g) {
      setWatchedIds((prev) => (prev.includes(g.user_id) ? prev : [...prev, g.user_id]));
      g.frames.forEach((f) => markViewed(f.id));
    }
  };

  return (
    <div className="py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-start px-4 py-4">
          {/* My Story tile */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => (own ? handleOpen(grouped.indexOf(own)) : handleAddClick())}
                className="w-[72px] h-[112px] rounded-full flex flex-col items-center pt-2 transition-transform active:scale-95 neo-button-icon"
                aria-label={own ? "View my story" : "Add story"}
              >
                {own ? (
                  <>
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(10,100%,55%)]">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                        <img src={own.avatar ?? ""} alt="My story" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <StoryMediaIndicator mediaType={own.mediaType} muted={false} />
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
              {own && (
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
          {others.map((story) => {
            const groupIndex = grouped.indexOf(story);
            const watched = watchedIds.includes(story.user_id);
            return (
              <button
                key={story.user_id}
                onClick={() => handleOpen(groupIndex)}
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
                        src={story.avatar ?? ""}
                        alt={story.username}
                        className={`w-full h-full object-cover ${watched ? "grayscale" : ""}`}
                      />
                    </div>
                  </div>
                  <StoryMediaIndicator mediaType={story.mediaType} muted={watched} />
                </div>
                <span className={`text-xs font-medium ${watched ? "text-muted-foreground" : "text-foreground"}`}>
                  {story.username}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <StoryViewer
        list={viewerList}
        startId={openIdx ?? 0}
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
      />

      <StoryComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  );
};

export default Stories;
