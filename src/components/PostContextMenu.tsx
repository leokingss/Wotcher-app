import { ReactNode } from "react";
import { Bookmark, Flag, Link2, Send, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface PostContextMenuProps {
  children: ReactNode;
  label?: string;
}

const PostContextMenu = ({ children, label = "Post" }: PostContextMenuProps) => (
  <ContextMenu>
    <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
    <ContextMenuContent className="neo-card border-none rounded-2xl p-2 min-w-52">
      <ContextMenuItem
        onSelect={() => toast.success(`${label} saved`)}
        className="rounded-xl gap-2"
      >
        <Bookmark className="w-4 h-4" /> Save
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => {
          navigator.clipboard?.writeText(window.location.href);
          toast.success("Link copied");
        }}
        className="rounded-xl gap-2"
      >
        <Link2 className="w-4 h-4" /> Copy link
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => toast("Share sheet")} className="rounded-xl gap-2">
        <Send className="w-4 h-4" /> Share
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => toast("Hidden")} className="rounded-xl gap-2">
        <EyeOff className="w-4 h-4" /> Hide
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => toast("Marked seen")} className="rounded-xl gap-2">
        <Eye className="w-4 h-4" /> Mark as seen
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onSelect={() => toast.error("Reported")}
        className="rounded-xl gap-2 text-destructive focus:text-destructive"
      >
        <Flag className="w-4 h-4" /> Report
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);

export default PostContextMenu;
