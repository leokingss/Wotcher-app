import { Plus } from "lucide-react";

const stories = [
  { id: 1, username: "My Story", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isOwn: true, hasStory: false, gradient: 1 },
  { id: 2, username: "Lina", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", hasStory: true, gradient: 1 },
  { id: 3, username: "Ahmed", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", hasStory: true, gradient: 2 },
  { id: 4, username: "Jenny", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", hasStory: true, gradient: 3 },
  { id: 5, username: "Linda", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", hasStory: true, gradient: 4 },
  { id: 6, username: "Karim", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", hasStory: true, gradient: 1 },
];

const Stories = () => {
  return (
    <div className="py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              {story.isOwn ? (
                <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center bg-card">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
              ) : (
                <div className={`story-ring story-ring-${story.gradient}`}>
                  <div className="story-ring-inner">
                    <img
                      src={story.avatar}
                      alt={story.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  </div>
                </div>
              )}
              <span className="text-xs text-foreground font-medium">
                {story.username}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stories;
