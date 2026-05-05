import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { followUsers as mockUsers } from "@/data/mockSocial";


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
