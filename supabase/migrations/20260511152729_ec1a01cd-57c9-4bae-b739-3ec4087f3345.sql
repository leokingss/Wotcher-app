-- Enums
CREATE TYPE public.list_visibility AS ENUM ('public', 'private', 'shared');
CREATE TYPE public.saved_item_type AS ENUM ('post', 'listing');

-- Tables
CREATE TABLE public.saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  visibility public.list_visibility NOT NULL DEFAULT 'private',
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_lists_owner ON public.saved_lists(owner_id, created_at DESC);

CREATE TABLE public.saved_list_members (
  list_id uuid NOT NULL REFERENCES public.saved_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, user_id)
);
CREATE INDEX idx_saved_list_members_user ON public.saved_list_members(user_id);

CREATE TABLE public.saved_items (
  list_id uuid NOT NULL REFERENCES public.saved_lists(id) ON DELETE CASCADE,
  item_type public.saved_item_type NOT NULL,
  item_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, item_type, item_id)
);
CREATE INDEX idx_saved_items_lookup ON public.saved_items(item_type, item_id);

-- updated_at trigger
CREATE TRIGGER trg_saved_lists_updated
  BEFORE UPDATE ON public.saved_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: can a viewer see this list?
CREATE OR REPLACE FUNCTION public.can_view_list(_list uuid, _viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saved_lists l
    WHERE l.id = _list
      AND (
        l.visibility = 'public'
        OR l.owner_id = _viewer
        OR (l.visibility = 'shared' AND EXISTS (
          SELECT 1 FROM public.saved_list_members m
          WHERE m.list_id = l.id AND m.user_id = _viewer
        ))
      )
  );
$$;

-- Helper: is the viewer the owner?
CREATE OR REPLACE FUNCTION public.is_list_owner(_list uuid, _viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.saved_lists WHERE id = _list AND owner_id = _viewer);
$$;

-- RLS
ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- saved_lists
CREATE POLICY "view permitted lists"
  ON public.saved_lists FOR SELECT
  USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'shared' AND EXISTS (
      SELECT 1 FROM public.saved_list_members m
      WHERE m.list_id = saved_lists.id AND m.user_id = auth.uid()
    ))
  );

CREATE POLICY "owner inserts list"
  ON public.saved_lists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner updates list"
  ON public.saved_lists FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "owner deletes list"
  ON public.saved_lists FOR DELETE
  USING (auth.uid() = owner_id);

-- saved_list_members
CREATE POLICY "owner or member reads membership"
  ON public.saved_list_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "owner adds members"
  ON public.saved_list_members FOR INSERT
  WITH CHECK (public.is_list_owner(list_id, auth.uid()));

CREATE POLICY "owner removes members"
  ON public.saved_list_members FOR DELETE
  USING (public.is_list_owner(list_id, auth.uid()));

-- saved_items
CREATE POLICY "view items in viewable lists"
  ON public.saved_items FOR SELECT
  USING (public.can_view_list(list_id, auth.uid()));

CREATE POLICY "owner inserts items"
  ON public.saved_items FOR INSERT
  WITH CHECK (public.is_list_owner(list_id, auth.uid()));

CREATE POLICY "owner deletes items"
  ON public.saved_items FOR DELETE
  USING (public.is_list_owner(list_id, auth.uid()));

-- One-time migration: copy listing_favorites into a private "Favorites" list per user
DO $$
DECLARE
  r RECORD;
  new_list uuid;
BEGIN
  FOR r IN
    SELECT user_id, array_agg(listing_id) AS listing_ids
    FROM public.listing_favorites
    GROUP BY user_id
  LOOP
    INSERT INTO public.saved_lists (owner_id, name, visibility)
    VALUES (r.user_id, 'Favorites', 'private')
    RETURNING id INTO new_list;

    INSERT INTO public.saved_items (list_id, item_type, item_id)
    SELECT new_list, 'listing'::public.saved_item_type, unnest(r.listing_ids)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;