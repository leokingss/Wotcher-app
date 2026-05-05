import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface FollowUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
}

const mockUsers: FollowUser[] = [
  { id: 1, username: "sarah_designs", name: "Sarah Lee", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: 2, username: "mike_photos", name: "Mike Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: 3, username: "creative_jane", name: "Jane Doe", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: 4, username: "djsoul", name: "DJ Soul", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop" },
  { id: 5, username: "linda.k", name: "Linda K", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
];

interface FollowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "followers" | "following" | null;
}

const FollowSheet = ({ open, onOpenChange, type }: FollowSheetProps) => {
  const title = type === "followers" ? "Followers" : "Following";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="neo-card border-0 rounded-t-3xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto pb-8">
          {mockUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <div className="neo-card p-0.5 rounded-full">
                <img src={u.avatar} alt={u.username} className="w-11 h-11 rounded-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.username}</p>
                <p className="text-xs text-muted-foreground truncate">{u.name}</p>
              </div>
              <button className="action-button action-button-primary text-xs py-1.5 px-4">
                {type === "followers" ? "Follow" : "Following"}
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FollowSheet;
