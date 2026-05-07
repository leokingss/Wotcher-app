import { useState } from "react";
import { UserPlus, Lock, Users, Heart, UsersRound, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type FriendCircle = "private" | "family" | "friends" | string;

const BUILTIN: { id: FriendCircle; label: string; Icon: any; tone: string }[] = [
  { id: "private", label: "Private", Icon: Lock, tone: "text-muted-foreground" },
  { id: "family", label: "Family", Icon: Heart, tone: "text-primary" },
  { id: "friends", label: "Friends only", Icon: Users, tone: "text-primary" },
];

interface Props {
  username: string;
  onSelect?: (circle: FriendCircle) => void;
  variant?: "icon" | "pill";
}

const FriendCircleMenu = ({ username, onSelect, variant = "icon" }: Props) => {
  const [circle, setCircle] = useState<FriendCircle | null>(null);
  const [groups, setGroups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("friend-groups") ?? "[]"); }
    catch { return []; }
  });
  const [groupDialog, setGroupDialog] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  const persistGroups = (g: string[]) => {
    setGroups(g);
    localStorage.setItem("friend-groups", JSON.stringify(g));
  };

  const choose = (c: FriendCircle) => {
    setCircle(c);
    onSelect?.(c);
  };

  const createGroup = () => {
    const name = newGroup.trim();
    if (!name) return;
    const next = Array.from(new Set([...groups, name]));
    persistGroups(next);
    choose(name);
    setNewGroup("");
    setGroupDialog(false);
  };

  const activeLabel =
    circle && BUILTIN.find((b) => b.id === circle)?.label
      ? BUILTIN.find((b) => b.id === circle)!.label
      : circle;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "pill" ? (
            <button
              aria-label={`Add ${username} to a circle`}
              className="action-button action-button-primary text-xs py-1.5 px-4"
            >
              {circle ? activeLabel : "Follow"}
            </button>
          ) : (
            <button
              aria-label={`Add ${username} to a circle`}
              className="neo-button-icon w-8 h-8 flex items-center justify-center rounded-full text-primary"
            >
              {circle ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="neo-card border-0 rounded-2xl p-2 min-w-[220px]">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Add to circle
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {BUILTIN.map((b) => (
            <DropdownMenuItem
              key={b.id}
              onClick={() => choose(b.id)}
              className="rounded-xl gap-2 cursor-pointer"
            >
              <b.Icon className={`w-4 h-4 ${b.tone}`} />
              <span className="flex-1">{b.label}</span>
              {circle === b.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          {groups.length > 0 && <DropdownMenuSeparator />}
          {groups.map((g) => (
            <DropdownMenuItem
              key={g}
              onClick={() => choose(g)}
              className="rounded-xl gap-2 cursor-pointer"
            >
              <UsersRound className="w-4 h-4 text-primary" />
              <span className="flex-1 truncate">{g}</span>
              {circle === g && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); setGroupDialog(true); }}
            className="rounded-xl gap-2 cursor-pointer text-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create a group</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent className="neo-card border-0 rounded-3xl">
          <DialogHeader>
            <DialogTitle>New friends group</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            placeholder="e.g. Studio crew, College, Tour buddies"
            className="w-full neo-card-inset rounded-xl px-4 py-3 text-sm bg-transparent outline-none"
          />
          <DialogFooter>
            <button
              onClick={createGroup}
              disabled={!newGroup.trim()}
              className="action-button action-button-primary disabled:opacity-50"
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FriendCircleMenu;
