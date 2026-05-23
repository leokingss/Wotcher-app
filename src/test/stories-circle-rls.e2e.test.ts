/**
 * End-to-end RLS test for circle-scoped stories.
 *
 * Verifies that `public.stories.audience_circle` is enforced by RLS:
 *   - Public stories are visible to everyone.
 *   - Circle-scoped stories are visible only to the owner and to
 *     authenticated users that are members of the matching circle
 *     in `public.circle_members`.
 *
 * Implementation: shells out to `psql` and runs as the postgres
 * superuser so we can simulate three signed-in users by setting
 * `request.jwt.claims` + `SET LOCAL ROLE authenticated`. This is the
 * same technique PostgREST uses, so it exercises the real RLS policy.
 *
 * Skipped automatically when `psql`/`PGHOST` is not available
 * (e.g. CI without DB access).
 */
import { describe, it, expect } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";

const hasPsql = (() => {
  if (!process.env.PGHOST) return false;
  const r = spawnSync("psql", ["-c", "SELECT 1"], { stdio: "ignore" });
  return r.status === 0;
})();

const runSql = (sql: string): string =>
  execFileSync("psql", ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql], {
    encoding: "utf8",
  }).trim();

const OWNER = "11111111-1111-4111-8111-111111111111";
const FRIEND = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";

const seed = `
  -- Clean any prior run
  DELETE FROM auth.users WHERE id IN ('${OWNER}','${FRIEND}','${STRANGER}');

  -- Three users
  INSERT INTO auth.users (id) VALUES ('${OWNER}'), ('${FRIEND}'), ('${STRANGER}');

  -- Profiles (FK to auth.users)
  INSERT INTO public.profiles (id, username, display_name)
  VALUES
    ('${OWNER}',    'rls_owner_${Date.now()}',    'Owner'),
    ('${FRIEND}',   'rls_friend_${Date.now()}',   'Friend'),
    ('${STRANGER}', 'rls_stranger_${Date.now()}', 'Stranger');

  -- FRIEND is in OWNER's "friends" circle (but not "family").
  INSERT INTO public.circle_members (owner_id, member_id, circle)
  VALUES ('${OWNER}', '${FRIEND}', 'friends');

  -- Three active stories from OWNER: public / friends-only / family-only.
  INSERT INTO public.stories (user_id, media_type, media_url, audience_circle, expires_at) VALUES
    ('${OWNER}', 'photo', 'https://example.com/public.jpg',  NULL,      now() + interval '1 hour'),
    ('${OWNER}', 'photo', 'https://example.com/friends.jpg', 'friends', now() + interval '1 hour'),
    ('${OWNER}', 'photo', 'https://example.com/family.jpg',  'family',  now() + interval '1 hour');
`;

const cleanup = `DELETE FROM auth.users WHERE id IN ('${OWNER}','${FRIEND}','${STRANGER}');`;

/** Count stories from OWNER that are visible to `viewerId` under RLS. */
const countVisibleAs = (viewerId: string | null): number => {
  // Wrap in a transaction so SET LOCAL only applies to this query.
  const claim = viewerId
    ? `'{"sub":"${viewerId}","role":"authenticated"}'`
    : `'{"role":"anon"}'`;
  const role = viewerId ? "authenticated" : "anon";
  const sql = `
    BEGIN;
      SET LOCAL ROLE ${role};
      SET LOCAL "request.jwt.claims" = ${claim};
      SELECT count(*) FROM public.stories WHERE user_id = '${OWNER}';
    COMMIT;
  `;
  // psql prints one count line.
  const out = runSql(sql);
  const line = out.split("\n").find((l) => /^\d+$/.test(l.trim())) ?? "0";
  return parseInt(line.trim(), 10);
};

describe.skipIf(!hasPsql)("stories audience_circle RLS (e2e)", () => {
  it("respects circle audience for stories visibility", () => {
    try {
      runSql(seed);

      // Owner sees all three of their own stories.
      expect(countVisibleAs(OWNER)).toBe(3);

      // Friend (member of "friends" circle) sees public + friends-scoped, NOT family.
      expect(countVisibleAs(FRIEND)).toBe(2);

      // Stranger sees only the public story.
      expect(countVisibleAs(STRANGER)).toBe(1);

      // Anonymous (not signed in) — RLS treats auth.uid() as NULL → only public is visible.
      expect(countVisibleAs(null)).toBe(1);
    } finally {
      runSql(cleanup);
    }
  });

  it("hides circle-scoped story when membership is removed", () => {
    try {
      runSql(seed);
      // Sanity: friend sees 2.
      expect(countVisibleAs(FRIEND)).toBe(2);

      // Remove FRIEND from the "friends" circle.
      runSql(
        `DELETE FROM public.circle_members WHERE owner_id='${OWNER}' AND member_id='${FRIEND}';`
      );

      // Friend now only sees the public story.
      expect(countVisibleAs(FRIEND)).toBe(1);
    } finally {
      runSql(cleanup);
    }
  });
});
