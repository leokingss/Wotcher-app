import BottomNav from "@/components/BottomNav";

const activities = [
  {
    id: 1,
    type: "like",
    user: "sarah_design",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    action: "liked your photo",
    time: "2h",
    postImage: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    type: "follow",
    user: "travel_mike",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    action: "started following you",
    time: "3h",
  },
  {
    id: 3,
    type: "like",
    user: "emma_art",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    action: "liked your photo",
    time: "5h",
    postImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    type: "comment",
    user: "john_dev",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    action: 'commented: "Amazing shot! 📸"',
    time: "8h",
    postImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=100&h=100&fit=crop",
  },
  {
    id: 5,
    type: "follow",
    user: "foodie_jane",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    action: "started following you",
    time: "1d",
  },
];

const Activity = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-center">
          <h1 className="font-semibold text-lg">Activity</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        <div className="py-2">
          <h2 className="font-semibold text-sm mb-3">Recent</h2>
        </div>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="neo-card flex items-center gap-3 p-3 rounded-2xl">
              <div className="neo-button-icon p-0.5">
                <img 
                  src={activity.avatar} 
                  alt={activity.user}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {activity.postImage ? (
                <div className="neo-card p-0.5 rounded-xl">
                  <img 
                    src={activity.postImage} 
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover"
                  />
                </div>
              ) : (
                <button className="action-button action-button-primary text-xs py-1.5 px-4">
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Activity;
