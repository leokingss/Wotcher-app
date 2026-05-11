import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Lock, Users, Plus, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSavedLists, SavedList, ListVisibility } from "@/hooks/useSavedLists";
import { CreateListDialog } from "@/components/SaveToListSheet";
import EmptyState from "@/components/EmptyState";

interface Props {
  profileUserId: string;
  isOwner: boolean;
}

const VisIcon = ({ v }: { v: ListVisibility }) =>
  v === "public" ? <Globe className="w-3.5 h-3.5" /> :
  v === "shared" ? <Users className="w-3.5 h-3.5" /> :
  <Lock className="w-3.5 h-3.5" />;

const ProfileSavedTab = ({ profileUserId, isOwner }: Props) => {
  const { user } = useAuth();
  const { myLists, itemsByList, refresh } = useSavedLists();
  const [otherLists, setOtherLists] = useState<SavedList[]>([]);
  const [otherCounts, setOtherCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(!isOwner);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (isOwner) return;
    setLoading(true);
    (async () => {
      // RLS will filter to lists this viewer can see
      const { data: lists } = await supabase
        .from("saved_lists")
        .select("*")
        .eq("owner_id", profileUserId)
        .order("created_at", { ascending: false });
      const ls = (lists ?? []) as SavedList[];
      setOtherLists(ls);
      if (ls.length > 0) {
        const { data: items } = await supabase
          .from("saved_items")
          .select("list_id")
          .in("list_id", ls.map((l) => l.id));
        const counts: Record<string, number> = {};
        (items ?? []).forEach((it: any) => { counts[it.list_id] = (counts[it.list_id] ?? 0) + 1; });
        setOtherCounts(counts);
      }
      setLoading(false);
    })();
  }, [profileUserId, isOwner]);

  const lists = isOwner ? myLists : otherLists;
  const countFor = (id: string) => isOwner ? (itemsByList[id]?.length ?? 0) : (otherCounts[id] ?? 0);

  return (
    <div>
      {isOwner && (
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full neo-button rounded-2xl px-4 py-3 mb-3 flex items-center gap-3"
        >
          <span className="neo-button-icon w-9 h-9 flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </span>
          <span className="font-semibold text-sm">New list</span>
        </button>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={isOwner ? "No saved lists yet" : "Nothing to see here"}
          description={isOwner
            ? "Tap the bookmark on any post or listing to start a list."
            : "This user hasn't shared any lists with you."}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {lists.map((l) => (
            <Link
              key={l.id}
              to={`/list/${l.id}`}
              className="neo-card rounded-2xl p-3 flex flex-col gap-2 transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-square rounded-xl bg-muted neo-card-inset flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <VisIcon v={l.visibility} />
                <span>{l.visibility}</span>
              </div>
              <p className="font-semibold text-sm truncate">{l.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {countFor(l.id)} item{countFor(l.id) === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <CreateListDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => refresh()} />
    </div>
  );
};

export default ProfileSavedTab;
