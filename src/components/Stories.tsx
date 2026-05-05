import { Plus } from "lucide-react";
import { stories } from "@/data/mockSocial";


const Stories = () => {
  return (
    <div className="py-4">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              {story.isOwn ? (
                <div className="relative">
                  <div className="neo-button-icon p-0.5">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="story-ring">
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
