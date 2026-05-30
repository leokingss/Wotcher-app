import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Drop,
  RedPacket,
  RedPacketShare,
  STARTING_BALANCE,
  TxKind,
  WalletTx,
  seededDrops,
  seededPackets,
} from "@/data/mockWallet";

const STORAGE_KEY = "wotcher.wallet.v1";

interface PersistShape {
  balance: number;
  txs: WalletTx[];
  drops: Drop[];
  packets: RedPacket[];
  claimedDropIds: string[];
}

interface WalletContextValue {
  balance: number;
  txs: WalletTx[];
  drops: Drop[];
  packets: RedPacket[];
  claimedDropIds: string[];

  topUp: (amount: number) => void;
  charge: (amount: number, kind: TxKind, label: string, meta?: Record<string, any>) => boolean;
  credit: (amount: number, kind: TxKind, label: string, meta?: Record<string, any>) => void;
  tip: (toUsername: string, amount: number, source?: string) => boolean;
  claimDrop: (dropId: string) => { ok: boolean; reason?: string };
  grabPacket: (packetId: string, username: string) => RedPacketShare | null;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const loadLocal = (): PersistShape => {
  if (typeof window === "undefined") {
    return { balance: STARTING_BALANCE, txs: [], drops: seededDrops, packets: seededPackets, claimedDropIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as PersistShape;
    return {
      balance: parsed.balance ?? STARTING_BALANCE,
      txs: parsed.txs ?? [],
      drops: parsed.drops?.length ? parsed.drops : seededDrops,
      packets: parsed.packets?.length ? parsed.packets : seededPackets,
      claimedDropIds: parsed.claimedDropIds ?? [],
    };
  } catch {
    return { balance: STARTING_BALANCE, txs: [], drops: seededDrops, packets: seededPackets, claimedDropIds: [] };
  }
};

const mkId = () => Math.random().toString(36).slice(2, 10);
const toCents = (gbp: number) => Math.round(gbp * 100);
const fromCents = (c: number) => +(c / 100).toFixed(2);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<PersistShape>(() => loadLocal());
  const hydratedFor = useRef<string | null>(null);

  // Persist local copy for snappy reads / signed-out demo
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Hydrate from Supabase on sign-in; ensure a wallet_balances row exists.
  useEffect(() => {
    if (!user) { hydratedFor.current = null; return; }
    if (hydratedFor.current === user.id) return;
    hydratedFor.current = user.id;

    (async () => {
      // Ensure balance row
      const { data: bal } = await supabase
        .from("wallet_balances")
        .select("balance_cents")
        .eq("user_id", user.id)
        .maybeSingle();

      let balanceCents = bal?.balance_cents;
      if (balanceCents == null) {
        balanceCents = toCents(STARTING_BALANCE);
        await supabase.from("wallet_balances").insert({
          user_id: user.id, balance_cents: balanceCents,
        });
      }

      // Recent transactions
      const { data: txRows } = await supabase
        .from("wallet_transactions")
        .select("id, kind, amount_cents, label, meta, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      const txs: WalletTx[] = (txRows ?? []).map((r: any) => ({
        id: r.id,
        kind: r.kind as TxKind,
        amount: fromCents(r.amount_cents),
        at: new Date(r.created_at).getTime(),
        label: r.label,
        meta: r.meta ?? undefined,
      }));

      setState((s) => ({ ...s, balance: fromCents(balanceCents!), txs }));
    })();
  }, [user]);

  // ---- internal helpers ----------------------------------------------------
  const writeBalance = useCallback(async (newBalance: number) => {
    if (!user) return;
    await supabase
      .from("wallet_balances")
      .upsert({ user_id: user.id, balance_cents: toCents(newBalance) }, { onConflict: "user_id" });
  }, [user]);

  const writeTx = useCallback(async (tx: WalletTx) => {
    if (!user) return;
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      kind: tx.kind,
      amount_cents: toCents(tx.amount),
      label: tx.label,
      meta: tx.meta ?? null,
    });
  }, [user]);

  const pushTx = useCallback((tx: WalletTx, balanceDelta: number) => {
    setState((s) => {
      const next = +(s.balance + balanceDelta).toFixed(2);
      void writeBalance(next);
      void writeTx(tx);
      return { ...s, balance: next, txs: [tx, ...s.txs].slice(0, 200) };
    });
  }, [writeBalance, writeTx]);

  // ---- public API ----------------------------------------------------------
  const topUp = useCallback((amount: number) => {
    if (amount <= 0) return;
    pushTx({ id: mkId(), kind: "topup", amount, at: Date.now(), label: `Top-up £${amount.toFixed(2)}` }, amount);
  }, [pushTx]);

  const charge = useCallback((amount: number, kind: TxKind, label: string, meta?: Record<string, any>) => {
    if (amount <= 0) return true;
    let ok = false;
    setState((s) => {
      if (s.balance < amount) return s;
      ok = true;
      const tx: WalletTx = { id: mkId(), kind, amount: -amount, at: Date.now(), label, meta };
      const next = +(s.balance - amount).toFixed(2);
      void writeBalance(next);
      void writeTx(tx);
      return { ...s, balance: next, txs: [tx, ...s.txs].slice(0, 200) };
    });
    return ok;
  }, [writeBalance, writeTx]);

  const credit = useCallback((amount: number, kind: TxKind, label: string, meta?: Record<string, any>) => {
    if (amount <= 0) return;
    pushTx({ id: mkId(), kind, amount, at: Date.now(), label, meta }, amount);
  }, [pushTx]);

  const tip = useCallback((toUsername: string, amount: number, source?: string) => {
    return charge(amount, "tip-out", `Tip to @${toUsername}${source ? ` · ${source}` : ""}`, { to: toUsername });
  }, [charge]);

  const claimDrop = useCallback((dropId: string) => {
    const drop = state.drops.find((d) => d.id === dropId);
    if (!drop) return { ok: false, reason: "Not found" };
    if (state.claimedDropIds.includes(dropId)) return { ok: false, reason: "Already claimed" };
    if (drop.access === "paid") {
      const ok = charge(drop.price ?? 0, "drop-buy", `Drop · ${drop.title}`, { dropId, creator: drop.creator });
      if (!ok) return { ok: false, reason: "Insufficient balance" };
    }
    setState((s) => ({ ...s, claimedDropIds: [...s.claimedDropIds, dropId] }));
    return { ok: true };
  }, [state.drops, state.claimedDropIds, charge]);

  const grabPacket = useCallback((packetId: string, username: string): RedPacketShare | null => {
    let result: RedPacketShare | null = null;
    setState((s) => {
      const packets = s.packets.map((p) => {
        if (p.id !== packetId) return p;
        const remainingIdx = p.shares.findIndex((sh) => !sh.claimedBy);
        if (remainingIdx === -1) return p;
        const share = { ...p.shares[remainingIdx], claimedBy: username, at: Date.now() };
        result = share;
        const shares = [...p.shares];
        shares[remainingIdx] = share;
        return { ...p, shares };
      });
      if (!result) return s;
      const label = result.trackId
        ? `Red packet · bonus track from @${packets.find((p) => p.id === packetId)?.creator}`
        : `Red packet · £${result.amount.toFixed(2)} from @${packets.find((p) => p.id === packetId)?.creator}`;
      const tx: WalletTx = {
        id: mkId(),
        kind: "packet-grab",
        amount: result.trackId ? 0 : result.amount,
        at: Date.now(),
        label,
        meta: { packetId, trackId: result.trackId },
      };
      const next = +(s.balance + (result.trackId ? 0 : result.amount)).toFixed(2);
      void writeBalance(next);
      void writeTx(tx);
      return {
        ...s,
        packets,
        balance: next,
        txs: [tx, ...s.txs].slice(0, 200),
      };
    });
    return result;
  }, [writeBalance, writeTx]);

  const value = useMemo(() => ({
    balance: state.balance,
    txs: state.txs,
    drops: state.drops,
    packets: state.packets,
    claimedDropIds: state.claimedDropIds,
    topUp, charge, credit, tip, claimDrop, grabPacket,
  }), [state, topUp, charge, credit, tip, claimDrop, grabPacket]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
};
