/**
 * End-to-end test: circle-scoped stories are only visible to members of
 * the selected friend circle.
 *
 * Exercises the real RLS policy on `public.stories` by creating three
 * throwaway auth users (owner, friend, stranger) via the service-role
 * admin API, seeding `circle_members` + `stories`, then querying as each
 * user with their own JWT-bearing anon client.
 *
 * Skipped automatically if `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
 * or `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) are not set.
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const ENABLED = !!(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const PASSWORD = "Test#Password!2026";
const stamp = Date.now();
const emailFor = (role: string) => `rls-${role}-${stamp}-${Math.random().toString(36).slice(2, 8)}@example.test`;

interface SeededUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

const adminCreate = async (admin: SupabaseClient, label: string): Promise<SeededUser> => {
  const email = emailFor(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { test: true, label },
  });
  if (error || !data.user) throw error ?? new Error(`createUser ${label} failed`);
  // Sign that user in via a fresh anon client so we get a real JWT.
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw signInErr;
  return { id: data.user.id, email, client: anon };
};

const ensureProfile = async (admin: SupabaseClient, userId: string, username: string) => {
  // The handle_new_user trigger usually creates a profile, but if it does not
  // (or sets a different username), upsert one we control so FK-bound inserts
  // for circle_members + stories succeed.
  await admin.from("profiles").upsert(
    { id: userId, username, display_name: username },
    { onConflict: "id" },
  );
};

const countOwnerStoriesVisibleTo = async (
  client: SupabaseClient,
  ownerId: string,
): Promise<number> => {
  const { data, error } = await client
    .from("stories")
    .select("id", { count: "exact" })
    .eq("user_id", ownerId);
  if (error) throw error;
  return data?.length ?? 0;
};

describe.skipIf(!ENABLED)("stories audience_circle RLS (e2e)", () => {
  it("only shows circle-scoped stories to members of that circle", async () => {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let owner: SeededUser | null = null;
    let friend: SeededUser | null = null;
    let stranger: SeededUser | null = null;

    try {
      // 1. Create three users + their JWT-bearing clients.
      [owner, friend, stranger] = await Promise.all([
        adminCreate(admin, "owner"),
        adminCreate(admin, "friend"),
        adminCreate(admin, "stranger"),
      ]);

      const ts = Date.now().toString(36);
      await Promise.all([
        ensureProfile(admin, owner.id, `rls_owner_${ts}`),
        ensureProfile(admin, friend.id, `rls_friend_${ts}`),
        ensureProfile(admin, stranger.id, `rls_stranger_${ts}`),
      ]);

      // 2. FRIEND joins OWNER's "friends" circle (but not "family").
      const { error: cmErr } = await admin
        .from("circle_members")
        .insert({ owner_id: owner.id, member_id: friend.id, circle: "friends" });
      expect(cmErr).toBeNull();

      // 3. Three active stories from OWNER: public, friends-only, family-only.
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { data: inserted, error: stErr } = await admin
        .from("stories")
        .insert([
          { user_id: owner.id, media_type: "photo", media_url: "https://example.com/public.jpg",  audience_circle: null,      expires_at: expiresAt },
          { user_id: owner.id, media_type: "photo", media_url: "https://example.com/friends.jpg", audience_circle: "friends", expires_at: expiresAt },
          { user_id: owner.id, media_type: "photo", media_url: "https://example.com/family.jpg",  audience_circle: "family",  expires_at: expiresAt },
        ])
        .select("id, audience_circle");
      expect(stErr).toBeNull();
      expect(inserted).toHaveLength(3);

      // 4. Visibility assertions (RLS enforced via each user's JWT).
      // Owner sees all three of their own stories.
      expect(await countOwnerStoriesVisibleTo(owner.client, owner.id)).toBe(3);

      // Friend (member of "friends") sees public + friends-scoped, NOT family.
      expect(await countOwnerStoriesVisibleTo(friend.client, owner.id)).toBe(2);

      // Stranger only sees the public story.
      expect(await countOwnerStoriesVisibleTo(stranger.client, owner.id)).toBe(1);

      // 5. Removing FRIEND from the circle hides the friends-scoped story.
      const { error: delErr } = await admin
        .from("circle_members")
        .delete()
        .eq("owner_id", owner.id)
        .eq("member_id", friend.id);
      expect(delErr).toBeNull();

      expect(await countOwnerStoriesVisibleTo(friend.client, owner.id)).toBe(1);
    } finally {
      // Cleanup: deleting the auth users cascades to profiles, circle_members, and stories.
      await Promise.all(
        [owner, friend, stranger]
          .filter((u): u is SeededUser => !!u)
          .map((u) => admin.auth.admin.deleteUser(u.id).catch(() => undefined)),
      );
    }
  }, 60_000);
});
