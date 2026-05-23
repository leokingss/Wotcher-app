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
import { useFriendCircles, type FriendCircleEnum } from "@/hooks/useFriendCircles";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export type FriendCircle = FriendCircleEnum | string;

const BUILTIN: { id: FriendCircleEnum; label: string; Icon: any; tone: string }[] = [
  { id: "private", label: "Private", Icon: Lock, tone: "text-muted-foreground" },
  { id: "family", label: "Family", Icon: Heart, tone: "text-primary" },
  { id: "friends", label: "Friends only", Icon: Users, tone: "text-primary" },
];

const GROUPS_KEY = "friend-groups";
const loadGroups = (): string[] => {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? "[]"); } catch { return []; }
};

interface Props {
  username: string;
  /** Database user id of the person being added to a circle. When present,
   *  selections persist to `circle_members`. When absent (e.g. mock data),
   *  selection is local-only. */
  memberId?: string | null;
  onSelect?: (circle: FriendCircle) => void;
  variant?: "icon" | "pill";
}

const FriendCircleMenu = ({ username, memberId, onSelect, variant = "icon" }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getCircle, setCircle: persistCircle } = useFriendCircles();

  // DB-backed circle when we have a memberId; local fallback otherwise
  const dbCircle = memberId ? getCircle(memberId) : null;
  const [localCircle, setLocalCircle] = useState<FriendCircle | null>(null);
  const circle: FriendCircle | null = memberId ? dbCircle : localCircle;

  const [groups, setGroups] = useState<string[]>(() => loadGroups());
  const [groupDialog, setGroupDialog] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  const persistGroups = (g: string[]) => {
    setGroups(g);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(g));
  };

  const choose = async (c: FriendCircle) => {
    onSelect?.(c);
    if (memberId) {
      if (!user) { navigate("/auth"); return; }
      // Custom group names map to the 'groups' enum value in the DB.
      const enumValue: FriendCircleEnum = (BUILTIN.some((b) => b.id === c) ? c : "groups") as FriendCircleEnum;
      await persistCircle(memberId, enumValue);
    } else {
      setLocalCircle(c);
    }
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
      : circle === "groups" ? "Groups" : circle;

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
