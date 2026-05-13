import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Music, Camera, Play } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { SortChips } from "@/components/SavedPostsView";
import { toast } from "sonner";
import { stories } from "@/data/mockSocial";

type SortKey = "newest" | "oldest";

export interface ArchivedStory {
  id: string;
  archived_at: string;
  mediaType: "music" | "photo" | "video";
  avatar: string;
  username: string;
}

const storyArchiveKey = (uid: string) => `watcher:story-archive:${uid}`;

export const getArchivedStories = (uid: string): Record<string, ArchivedStory> => {
  try {
    const raw = localStorage.getItem(storyArchiveKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const toggleStoryArchive = (uid: string, storyId: string, extra: Omit<ArchivedStory, "id" | "archived_at">): boolean => {
  const map = getArchivedStories(uid);
  if (map[storyId]) {
    delete map[storyId];
    localStorage.setItem(storyArchiveKey(uid), JSON.stringify(map));
    return false;
  }
  map[storyId] = { id: storyId, archived_at: new Date().toISOString(), ...extra };
  localStorage.setItem(storyArchiveKey(uid), JSON.stringify(map));
  return true;
};

const SORTS: { key: SortKey; label: string; icon: any }[] = [
  { key: "newest", label: "Newest", icon: Archive },
  { key: "oldest", label: "Oldest", icon: Archive },
];

const MediaBadge = ({ type }: { type: "music" | "photo" | "video" }) => {
  const Icon = type === "video" ? Play : type === "photo" ? Camera : Music;
  return (
    <div className="absolute top-1.5 left-1.5 neo-button-icon w-6 h-6 flex items-center justify-center">
      <Icon className="w-3 h-3 text-foreground" />
    </div>
  );
};

const StoryArchiveView = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<ArchivedStory[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const map = getArchivedStories(userId);
    const merged = Object.values(map);
    // Also hydrate from mock stories if archived IDs match them
    const mockMap = new Map(stories.filter(s => !s.isOwn).map(s => [String(s.id), s]));
    const hydrated = merged.map(it => {
      const m = mockMap.get(it.id);
      if (m) {
        return { ...it, avatar: it.avatar || m.avatar, username: it.username || m.username, mediaType: it.mediaType || m.mediaType || "photo" };
      }
      return it;
    });
    setItems(hydrated);
  }, [userId, tick]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === "newest") arr.sort((a, b) => b.archived_at.localeCompare(a.archived_at));
    else arr.sort((a, b) => a.archived_at.localeCompare(b.archived_at));
    return arr;
  }, [items, sort]);

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const map = getArchivedStories(userId);
    delete map[id];
    localStorage.setItem(storyArchiveKey(userId), JSON.stringify(map));
    toast.success("Restored to stories");
    setTick(t => t + 1);
  };

  return (
    <div>
      <div className="mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
          {SORTS.map((s) => {
            const Icon = s.icon;
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "neo-button-pressed text-primary" : "neo-button-icon text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived stories"
          description="Stories you archive are saved here for your eyes only."
        />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {sorted.map((it) => (
            <div
              key={it.id}
              className="relative aspect-[9/16] rounded-lg overflow-hidden neo-card-inset group"
            >
              <img src={it.avatar} alt={it.username} className="w-full h-full object-cover opacity-90" loading="lazy" />
              <MediaBadge type={it.mediaType || "photo"} />
              <button
                onClick={(e) => handleRestore(e, it.id)}
                className="absolute top-1.5 right-1.5 neo-button-icon w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Restore"
              >
                <ArchiveRestore className="w-3.5 h-3.5 text-primary" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-2 py-2">
                <p className="text-[10px] font-semibold truncate">{it.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryArchiveView;
