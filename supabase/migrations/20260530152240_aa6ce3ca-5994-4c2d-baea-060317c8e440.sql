
-- =========================================================
-- LIVE ROOMS + CHAT
-- =========================================================
CREATE TABLE public.live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('auction','sync','together')),
  title TEXT NOT NULL,
  cover_url TEXT,
  viewer_count INT NOT NULL DEFAULT 0,
  bidder_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_live BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('scheduled','live','ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_rooms TO authenticated;
GRANT ALL ON public.live_rooms TO service_role;
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_rooms_public_read" ON public.live_rooms FOR SELECT USING (true);
CREATE POLICY "live_rooms_host_insert" ON public.live_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "live_rooms_host_update" ON public.live_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "live_rooms_host_delete" ON public.live_rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);
CREATE TRIGGER trg_live_rooms_updated BEFORE UPDATE ON public.live_rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.live_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','bid','join','heart','system')),
  body TEXT,
  amount_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_chat_room_created ON public.live_chat(room_id, created_at DESC);
GRANT SELECT ON public.live_chat TO anon;
GRANT SELECT, INSERT ON public.live_chat TO authenticated;
GRANT ALL ON public.live_chat TO service_role;
ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_chat_public_read" ON public.live_chat FOR SELECT USING (true);
CREATE POLICY "live_chat_self_insert" ON public.live_chat FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- WALLET (private, per-user)
-- =========================================================
CREATE TABLE public.wallet_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_cents INT NOT NULL DEFAULT 5000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_balances TO authenticated;
GRANT ALL ON public.wallet_balances TO service_role;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_self_read"   ON public.wallet_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wallet_self_insert" ON public.wallet_balances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallet_self_update" ON public.wallet_balances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_wallet_balances_updated BEFORE UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('topup','tip-out','tip-in','bid','bid-refund','purchase','drop-buy','packet-grab','group-buy','payout')),
  amount_cents INT NOT NULL,
  label TEXT NOT NULL,
  counterparty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reference_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx_self_read"   ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wtx_self_insert" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- DROPS
-- =========================================================
CREATE TABLE public.drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  media_url TEXT,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  access TEXT NOT NULL DEFAULT 'free' CHECK (access IN ('free','followers','paid')),
  price_cents INT,
  releases_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  public_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drops TO authenticated;
GRANT ALL ON public.drops TO service_role;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drops_public_read"     ON public.drops FOR SELECT USING (true);
CREATE POLICY "drops_creator_insert"  ON public.drops FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "drops_creator_update"  ON public.drops FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "drops_creator_delete"  ON public.drops FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE TRIGGER trg_drops_updated BEFORE UPDATE ON public.drops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.drop_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (drop_id, user_id)
);
GRANT SELECT ON public.drop_claims TO anon;
GRANT SELECT, INSERT, DELETE ON public.drop_claims TO authenticated;
GRANT ALL ON public.drop_claims TO service_role;
ALTER TABLE public.drop_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drop_claims_public_read" ON public.drop_claims FOR SELECT USING (true);
CREATE POLICY "drop_claims_self_insert" ON public.drop_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "drop_claims_self_delete" ON public.drop_claims FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- RED PACKETS
-- =========================================================
CREATE TABLE public.red_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  total_cents INT NOT NULL,
  shares INT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'followers' CHECK (audience IN ('followers','public','group')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','exhausted','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.red_packets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.red_packets TO authenticated;
GRANT ALL ON public.red_packets TO service_role;
ALTER TABLE public.red_packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_public_read"    ON public.red_packets FOR SELECT USING (true);
CREATE POLICY "rp_creator_insert" ON public.red_packets FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "rp_creator_update" ON public.red_packets FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE TABLE public.packet_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES public.red_packets(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ
);
CREATE INDEX idx_packet_shares_packet ON public.packet_shares(packet_id);
GRANT SELECT ON public.packet_shares TO anon;
GRANT SELECT, INSERT, UPDATE ON public.packet_shares TO authenticated;
GRANT ALL ON public.packet_shares TO service_role;
ALTER TABLE public.packet_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_public_read" ON public.packet_shares FOR SELECT USING (true);
-- Allow authenticated users to insert/update shares (used by the grab flow);
-- the app guards "first unclaimed" with a transaction.
CREATE POLICY "ps_auth_insert" ON public.packet_shares FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ps_auth_claim"  ON public.packet_shares FOR UPDATE TO authenticated USING (claimed_by IS NULL OR claimed_by = auth.uid());

-- =========================================================
-- GROUP BUYS
-- =========================================================
CREATE TABLE public.group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  solo_price_cents INT NOT NULL,
  group_price_cents INT NOT NULL,
  target_members INT NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','succeeded','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.group_buys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_buys TO authenticated;
GRANT ALL ON public.group_buys TO service_role;
ALTER TABLE public.group_buys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gb_public_read"    ON public.group_buys FOR SELECT USING (true);
CREATE POLICY "gb_creator_insert" ON public.group_buys FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "gb_creator_update" ON public.group_buys FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "gb_creator_delete" ON public.group_buys FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE TRIGGER trg_group_buys_updated BEFORE UPDATE ON public.group_buys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.group_buy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID NOT NULL REFERENCES public.group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_buy_id, user_id)
);
GRANT SELECT ON public.group_buy_members TO anon;
GRANT SELECT, INSERT, DELETE ON public.group_buy_members TO authenticated;
GRANT ALL ON public.group_buy_members TO service_role;
ALTER TABLE public.group_buy_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbm_public_read" ON public.group_buy_members FOR SELECT USING (true);
CREATE POLICY "gbm_self_join"   ON public.group_buy_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gbm_self_leave"  ON public.group_buy_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- STREAKS (private)
-- =========================================================
CREATE TABLE public.streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_count INT NOT NULL DEFAULT 0,
  longest_count INT NOT NULL DEFAULT 0,
  last_check_in DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_self" ON public.streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_streaks_updated BEFORE UPDATE ON public.streaks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- CHART PREDICTIONS (private)
-- =========================================================
CREATE TABLE public.predict_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up','down')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  was_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, track_id)
);
CREATE INDEX idx_predict_picks_user_week ON public.predict_picks(user_id, week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predict_picks TO authenticated;
GRANT ALL ON public.predict_picks TO service_role;
ALTER TABLE public.predict_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predict_picks_self" ON public.predict_picks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.predict_scores (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_week DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.predict_scores TO anon;        -- public so we can show a leaderboard
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predict_scores TO authenticated;
GRANT ALL ON public.predict_scores TO service_role;
ALTER TABLE public.predict_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predict_scores_public_read" ON public.predict_scores FOR SELECT USING (true);
CREATE POLICY "predict_scores_self_write"  ON public.predict_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predict_scores_self_update" ON public.predict_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_predict_scores_updated BEFORE UPDATE ON public.predict_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
