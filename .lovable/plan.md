## Saved lists across posts & listings

### What you'll get

- A **Save** (bookmark) icon at the bottom-right of every post and every shop listing.
- Tapping it opens a **"Save to…" sheet** that shows your existing lists and a **"+ Create new list"** option.
- When creating a list you choose:
  - **Name** (required)
  - **Visibility:** Public · Private (only me) · Shared (private + pick which followers can view)
- A new **Saved** tab on your profile shows all your lists. Visitors only see lists they're allowed to see.
- Opening a list shows its saved posts and listings in one unified grid, with the option to remove items.
- Old `listing_favorites` data migrates into an auto-created **"Favorites"** list so nothing is lost.

### Visibility rules

- **Public** — anyone can see the list and its contents.
- **Private** — only the owner.
- **Shared** — owner + the followers explicitly granted access.

Counts are always public on the profile (e.g. "12 lists"); private list contents are not.

### Where things live

- **Save icon:** appears on `Post` (bottom-right of card actions) and on `ListingCard` (replaces the existing heart on listings, since the heart was a single‑list shortcut).
- **Save sheet:** shared component used from both surfaces.
- **Profile → Saved tab:** new tab next to existing tabs. List cards show cover collage (up to 4 thumbnails), name, visibility badge, item count.
- **List detail page:** `/list/:id` shows items + (for owner) edit/delete/share controls.

### Technical details

**New tables**

- `saved_lists` — `id, owner_id, name, visibility ('public'|'private'|'shared'), cover_url, created_at, updated_at`
- `saved_list_members` — `list_id, user_id` (followers granted view access on shared lists)
- `saved_items` — `list_id, item_type ('post'|'listing'), item_id, added_at` (PK on list_id+item_type+item_id)

**RLS**

- Lists are visible if: `visibility='public'` OR `owner_id = auth.uid()` OR (`visibility='shared'` AND viewer is in `saved_list_members`). Implemented via a `can_view_list(_list uuid, _viewer uuid)` SECURITY DEFINER function to avoid recursion.
- `saved_items` mirrors the parent list's visibility via the same function.
- Only the owner can insert/update/delete lists, members, and items.
- `saved_list_members`: only the list owner can add/remove rows; the granted user can read their own grant.

**Migration**

- One‑time SQL: for every user with rows in `listing_favorites`, create a "Favorites" list (private) and copy entries into `saved_items` as `item_type='listing'`. Then we can keep `listing_favorites` around for now (deprecated) and switch the UI to the new system.

**Hook & components**

- Replace `useFavorites` with `useSavedLists` (lists, items by list, membership grants, mutations).
- New components: `SaveButton`, `SaveToListSheet`, `CreateListDialog` (with follower multiselect for shared visibility), `ListCard`, `ListDetail` page, `ProfileSavedTab`.
- Shop tab's existing "Saved" section is removed (replaced by the profile Saved tab).

### Out of scope (for this pass)

- Reordering items inside a list.
- Collaborative lists (multiple editors).
- Notifying followers when granted access.

Approve this and I'll build it end‑to‑end.