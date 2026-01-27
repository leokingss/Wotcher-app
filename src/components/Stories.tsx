import { Plus } from "lucide-react";

const stories = [
  { id: 1, username: "your_story", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isOwn: true, hasStory: false },
  { id: 2, username: "sarah_design", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", hasStory: true },
  { id: 3, username: "travel_mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", hasStory: true },
  { id: 4, username: "foodie_jane", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", hasStory: true },
  { id: 5, username: "alex_photo", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", hasStory: true },
  { id: 6, username: "emma_art", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", hasStory: true },
  { id: 7, username: "john_dev", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", hasStory: true },
];

const Stories = () => {
  return (
    <div className="bg-background border-b border-border py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`relative ${story.hasStory ? 'story-ring' : ''}`}>
                <div className={story.hasStory ? 'story-ring-inner' : ''}>
                  <img
                    src={story.avatar}
                    alt={story.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
                {story.isOwn && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 instagram-gradient-bg rounded-full flex items-center justify-center border-2 border-background">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-foreground truncate w-16 text-center">
                {story.isOwn ? "Your story" : story.username.split('_')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stories;
