import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Users, Trash2, Bookmark, Gavel, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSavedLists, SavedList, SavedItem, ListVisibility } from "@/hooks/useSavedLists";
import { Listing } from "@/hooks/useListings";
import ListingDialog from "@/components/ListingDialog";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

const VisIcon = ({ v }: { v: ListVisibility }) =>
  v === "public" ? <Globe className="w-4 h-4" /> :
  v === "shared" ? <Users className="w-4 h-4" /> :
  <Lock className="w-4 h-4" />;

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { removeItem, deleteList } = useSavedLists();
  const [list, setList] = useState<SavedList | null>(null);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [openListing, setOpenListing] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      const [{ data: l }, { data: its }] = await Promise.all([
        supabase.from("saved_lists").select("*").eq("id", id).maybeSingle(),
        supabase.from("saved_items").select("*").eq("list_id", id).order("added_at", { ascending: false }),
      ]);
      setList((l as SavedList) ?? null);
      const itemRows = (its ?? []) as SavedItem[];
      setItems(itemRows);

      const postIds = itemRows.filter((i) => i.item_type === "post").map((i) => i.item_id);
      const listingIds = itemRows.filter((i) => i.item_type === "listing").map((i) => i.item_id);

      const [pRes, lRes] = await Promise.all([
        postIds.length
          ? supabase.from("posts").select("id, image_url, caption").in("id", postIds)
          : Promise.resolve({ data: [] as any[] }),
        listingIds.length
          ? supabase.from("listings").select("*, posts:post_id(image_url)").in("id", listingIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setPosts(pRes.data ?? []);
      setListings(((lRes.data ?? []) as any[]).map((x) => ({ ...x, image_url: x.posts?.image_url ?? null })) as Listing[]);
      setLoading(false);
    })();
  }, [id]);

  const isOwner = !!user && !!list && list.owner_id === user.id;

  const handleRemove = async (type: "post" | "listing", itemId: string) => {
    if (!list) return;
    await removeItem(list.id, type, itemId);
    setItems((prev) => prev.filter((i) => !(i.item_type === type && i.item_id === itemId)));
    if (type === "post") setPosts((prev) => prev.filter((p) => p.id !== itemId));
    else setListings((prev) => prev.filter((l) => l.id !== itemId));
  };

  const handleDelete = async () => {
    if (!list) return;
    if (!confirm(`Delete list "${list.name}"? This can't be undone.`)) return;
    await deleteList(list.id);
    navigate(-1);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading list…</div>;
  if (!list) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">List not found.</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} className="neo-button-icon w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="font-bold text-base truncate">{list.name}</h1>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
              <VisIcon v={list.visibility} />
              <span>{list.visibility}</span>
              <span>· {items.length} item{items.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          {isOwner ? (
            <button onClick={handleDelete} className="neo-button-icon w-10 h-10 flex items-center justify-center text-destructive">
              <Trash2 className="w-5 h-5" />
            </button>
          ) : <div className="w-10" />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-2">
        {items.length === 0 ? (
          <EmptyState icon={Bookmark} title="Empty list" description="Save posts and listings to fill this list." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <div key={`l-${l.id}`} className="relative">
                <button
                  onClick={() => setOpenListing(l.id)}
                  className="w-full neo-card p-1.5 rounded-2xl text-left overflow-hidden"
                >
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                    {l.image_url ? (
                      <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {l.type === "auction" ? <Gavel className="w-8 h-8 text-muted-foreground" /> : <Tag className="w-8 h-8 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                      <p className="text-xs font-medium truncate">{l.title}</p>
                    </div>
                  </div>
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleRemove("listing", l.id)}
                    aria-label="Remove from list"
                    className="absolute top-2 right-2 neo-button-icon w-8 h-8 flex items-center justify-center rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}
            {posts.map((p) => (
              <div key={`p-${p.id}`} className="relative">
                <div className="neo-card p-1.5 rounded-2xl overflow-hidden">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={p.image_url} alt={p.caption ?? "post"} className="w-full h-full object-cover" />
                    {p.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[11px] text-white truncate">{p.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemove("post", p.id)}
                    aria-label="Remove from list"
                    className="absolute top-2 right-2 neo-button-icon w-8 h-8 flex items-center justify-center rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {openListing && <ListingDialog listingId={openListing} open={!!openListing} onOpenChange={(v) => !v && setOpenListing(null)} />}
    </div>
  );
};

export default ListDetail;
