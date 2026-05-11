import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bookmark, Check, Globe, Lock, Users, Plus, Search } from "lucide-react";
import { useSavedLists, ListVisibility, SavedItemType } from "@/hooks/useSavedLists";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemType: SavedItemType;
  itemId: string;
  itemTitle?: string;
}

const SaveToListSheet = ({ open, onOpenChange, itemType, itemId, itemTitle }: Props) => {
  const { user } = useAuth();
  const { myLists, savedIndex, loaded, addItem, removeItem, createList } = useSavedLists();
  const [createOpen, setCreateOpen] = useState(false);

  const inListIds = savedIndex.get(`${itemType}:${itemId}`) ?? new Set<string>();

  const handleToggle = async (listId: string) => {
    if (inListIds.has(listId)) await removeItem(listId, itemType, itemId);
    else await addItem(listId, itemType, itemId);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 neo-card max-h-[85vh] overflow-y-auto p-5 pb-8 sm:max-w-lg sm:mx-auto sm:left-0 sm:right-0 sm:inset-x-0"
        >
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bookmark className="w-5 h-5 text-primary" />
              Save {itemTitle ? `"${itemTitle}"` : ""} to…
            </SheetTitle>
            <SheetDescription className="text-xs">
              Pick a list or create a new one.
            </SheetDescription>
          </SheetHeader>

          {!user ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sign in to save items.</div>
          ) : !loaded ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading lists…</div>
          ) : (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full neo-button rounded-2xl px-4 py-3 flex items-center gap-3 text-left"
              >
                <span className="neo-button-icon w-9 h-9 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </span>
                <span className="font-semibold text-sm">Create new list</span>
              </button>

              {myLists.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  You don't have any lists yet. Create one to start saving.
                </p>
              ) : (
                myLists.map((l) => {
                  const inList = inListIds.has(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleToggle(l.id)}
                      className={`w-full neo-card rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                        inList ? "ring-1 ring-primary/40" : ""
                      }`}
                    >
                      <span className="neo-button-icon w-9 h-9 flex items-center justify-center">
                        <VisibilityIcon visibility={l.visibility} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-sm truncate">{l.name}</span>
                        <span className="block text-[11px] text-muted-foreground capitalize">
                          {l.visibility}
                        </span>
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          inList ? "bg-primary text-primary-foreground" : "neo-button-icon"
                        }`}
                      >
                        {inList && <Check className="w-4 h-4" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CreateListDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (list) => {
          // immediately add the current item into the new list
          await addItem(list.id, itemType, itemId);
        }}
      />
    </>
  );
};

const VisibilityIcon = ({ visibility }: { visibility: ListVisibility }) => {
  if (visibility === "public") return <Globe className="w-4 h-4 text-primary" />;
  if (visibility === "shared") return <Users className="w-4 h-4 text-primary" />;
  return <Lock className="w-4 h-4 text-primary" />;
};

interface FollowerOption { id: string; username: string; display_name: string | null; avatar_url: string | null; }

interface CreateProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (list: { id: string }) => void;
}

export const CreateListDialog = ({ open, onOpenChange, onCreated }: CreateProps) => {
  const { user } = useAuth();
  const { createList } = useSavedLists();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<ListVisibility>("private");
  const [followers, setFollowers] = useState<FollowerOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setName(""); setVisibility("private"); setSelected(new Set()); setSearch("");
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !user || visibility !== "shared") return;
    if (followers.length > 0) return;
    (async () => {
      // people who follow ME (my followers)
      const { data: rows } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);
      const ids = (rows ?? []).map((r: any) => r.follower_id);
      if (ids.length === 0) { setFollowers([]); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      setFollowers((profs ?? []) as FollowerOption[]);
    })();
  }, [open, user?.id, visibility]);

  const filtered = followers.filter((f) =>
    !search ||
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    (f.display_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!name.trim()) { toast.error("Give your list a name"); return; }
    setSubmitting(true);
    const list = await createList({
      name: name.trim(),
      visibility,
      memberIds: visibility === "shared" ? Array.from(selected) : undefined,
    });
    setSubmitting(false);
    if (list) {
      onOpenChange(false);
      if (onCreated) onCreated(list);
      toast.success(`Created "${list.name}"`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-md">
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="list-name" className="text-xs">Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vintage finds"
              className="neo-card-inset border-0 mt-1"
              autoFocus
              maxLength={60}
            />
          </div>

          <div>
            <Label className="text-xs">Visibility</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {([
                { v: "public", icon: Globe, label: "Public", desc: "Anyone" },
                { v: "private", icon: Lock, label: "Private", desc: "Only you" },
                { v: "shared", icon: Users, label: "Shared", desc: "Pick followers" },
              ] as const).map(({ v, icon: Icon, label, desc }) => {
                const active = visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`rounded-2xl p-3 text-left transition-colors ${
                      active ? "neo-card-inset ring-1 ring-primary/40" : "neo-card"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {visibility === "shared" && (
            <div>
              <Label className="text-xs">Allow these followers to view</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search followers"
                  className="neo-card-inset border-0 pl-9"
                />
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {followers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    You don't have any followers yet.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No matches.</p>
                ) : (
                  filtered.map((f) => {
                    const checked = selected.has(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            checked ? next.delete(f.id) : next.add(f.id);
                            return next;
                          });
                        }}
                        className={`w-full neo-card rounded-xl px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                          checked ? "ring-1 ring-primary/40" : ""
                        }`}
                      >
                        <span className="neo-button-icon w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt={f.username} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            f.username[0]?.toUpperCase()
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold truncate">@{f.username}</span>
                          {f.display_name && (
                            <span className="block text-[11px] text-muted-foreground truncate">{f.display_name}</span>
                          )}
                        </span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            checked ? "bg-primary text-primary-foreground" : "neo-button-icon"
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {selected.size} follower{selected.size === 1 ? "" : "s"} selected
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting || !name.trim()}>
              Create list
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToListSheet;
