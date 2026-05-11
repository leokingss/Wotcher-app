import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ListVisibility = "public" | "private" | "shared";
export type SavedItemType = "post" | "listing";

export interface SavedList {
  id: string;
  owner_id: string;
  name: string;
  visibility: ListVisibility;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedItem {
  list_id: string;
  item_type: SavedItemType;
  item_id: string;
  added_at: string;
}

interface Ctx {
  myLists: SavedList[];
  itemsByList: Record<string, SavedItem[]>;
  // key = `${type}:${id}` => set of list_ids the item is saved to
  savedIndex: Map<string, Set<string>>;
  loaded: boolean;
  refresh: () => Promise<void>;
  isItemSaved: (type: SavedItemType, id: string) => boolean;
  createList: (input: { name: string; visibility: ListVisibility; memberIds?: string[] }) => Promise<SavedList | null>;
  updateList: (id: string, patch: Partial<Pick<SavedList, "name" | "visibility">> & { memberIds?: string[] }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addItem: (listId: string, type: SavedItemType, itemId: string) => Promise<void>;
  removeItem: (listId: string, type: SavedItemType, itemId: string) => Promise<void>;
}

const SavedListsContext = createContext<Ctx | undefined>(undefined);

export const SavedListsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [myLists, setMyLists] = useState<SavedList[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, SavedItem[]>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setMyLists([]); setItemsByList({}); setLoaded(true); return;
    }
    setLoaded(false);
    const { data: lists } = await supabase
      .from("saved_lists")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    const myL = (lists ?? []) as SavedList[];
    setMyLists(myL);

    if (myL.length > 0) {
      const { data: items } = await supabase
        .from("saved_items")
        .select("*")
        .in("list_id", myL.map((l) => l.id))
        .order("added_at", { ascending: false });
      const grouped: Record<string, SavedItem[]> = {};
      (items ?? []).forEach((it: any) => {
        (grouped[it.list_id] ||= []).push(it as SavedItem);
      });
      setItemsByList(grouped);
    } else {
      setItemsByList({});
    }
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const savedIndex = useMemo(() => {
    const map = new Map<string, Set<string>>();
    Object.entries(itemsByList).forEach(([listId, items]) => {
      items.forEach((it) => {
        const key = `${it.item_type}:${it.item_id}`;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(listId);
      });
    });
    return map;
  }, [itemsByList]);

  const isItemSaved = useCallback((type: SavedItemType, id: string) => {
    return (savedIndex.get(`${type}:${id}`)?.size ?? 0) > 0;
  }, [savedIndex]);

  const createList: Ctx["createList"] = useCallback(async ({ name, visibility, memberIds }) => {
    if (!user) { toast.error("Sign in to create a list"); return null; }
    const { data, error } = await supabase
      .from("saved_lists")
      .insert({ owner_id: user.id, name: name.trim(), visibility })
      .select("*")
      .maybeSingle();
    if (error || !data) { toast.error(error?.message ?? "Couldn't create list"); return null; }
    if (visibility === "shared" && memberIds && memberIds.length > 0) {
      await supabase.from("saved_list_members").insert(
        memberIds.map((uid) => ({ list_id: data.id, user_id: uid }))
      );
    }
    setMyLists((prev) => [data as SavedList, ...prev]);
    setItemsByList((prev) => ({ ...prev, [data.id]: [] }));
    return data as SavedList;
  }, [user?.id]);

  const updateList: Ctx["updateList"] = useCallback(async (id, patch) => {
    if (!user) return;
    const { memberIds, ...rest } = patch;
    if (Object.keys(rest).length > 0) {
      const { error } = await supabase.from("saved_lists").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    if (memberIds !== undefined) {
      // wipe + reinsert
      await supabase.from("saved_list_members").delete().eq("list_id", id);
      if (memberIds.length > 0) {
        await supabase.from("saved_list_members").insert(
          memberIds.map((uid) => ({ list_id: id, user_id: uid }))
        );
      }
    }
    setMyLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...rest } as SavedList : l)));
  }, [user?.id]);

  const deleteList: Ctx["deleteList"] = useCallback(async (id) => {
    const { error } = await supabase.from("saved_lists").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setMyLists((prev) => prev.filter((l) => l.id !== id));
    setItemsByList((prev) => {
      const next = { ...prev }; delete next[id]; return next;
    });
  }, []);

  const addItem: Ctx["addItem"] = useCallback(async (listId, type, itemId) => {
    // optimistic
    const optimistic: SavedItem = { list_id: listId, item_type: type, item_id: itemId, added_at: new Date().toISOString() };
    setItemsByList((prev) => ({ ...prev, [listId]: [optimistic, ...(prev[listId] ?? [])] }));
    const { error } = await supabase
      .from("saved_items")
      .insert({ list_id: listId, item_type: type, item_id: itemId });
    if (error) {
      setItemsByList((prev) => ({
        ...prev,
        [listId]: (prev[listId] ?? []).filter((i) => !(i.item_type === type && i.item_id === itemId)),
      }));
      toast.error(error.message);
    }
  }, []);

  const removeItem: Ctx["removeItem"] = useCallback(async (listId, type, itemId) => {
    const prevItems = itemsByList[listId] ?? [];
    setItemsByList((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((i) => !(i.item_type === type && i.item_id === itemId)),
    }));
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("list_id", listId)
      .eq("item_type", type)
      .eq("item_id", itemId);
    if (error) {
      setItemsByList((prev) => ({ ...prev, [listId]: prevItems }));
      toast.error(error.message);
    }
  }, [itemsByList]);

  return (
    <SavedListsContext.Provider value={{
      myLists, itemsByList, savedIndex, loaded, refresh,
      isItemSaved, createList, updateList, deleteList, addItem, removeItem,
    }}>
      {children}
    </SavedListsContext.Provider>
  );
};

export const useSavedLists = () => {
  const ctx = useContext(SavedListsContext);
  if (!ctx) throw new Error("useSavedLists must be used within SavedListsProvider");
  return ctx;
};
