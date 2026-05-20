import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type InviteStatus = "pending" | "claimed" | "used" | "expired" | "revoked";
export type InviteType = "email" | "sms" | "share_link";

export interface Invite {
  id: string;
  code: string;
  inviter_user_id: string;
  invitee_user_id: string | null;
  invitee_email: string | null;
  invitee_phone: string | null;
  invite_type: InviteType;
  status: InviteStatus;
  created_at: string;
  claimed_at: string | null;
  used_at: string | null;
  expires_at: string;
  revoked_at: string | null;
}

const ALLOWANCE_DEFAULT = 17;

export const inviteUrl = (code: string) =>
  `${window.location.origin}/auth?mode=signup&invite=${encodeURIComponent(code)}`;

export const useInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [allowance, setAllowance] = useState(ALLOWANCE_DEFAULT);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) { setInvites([]); setLoading(false); return; }
    setLoading(true);
    const [{ data: inv }, { data: prof }] = await Promise.all([
      supabase.from("invites" as any).select("*").eq("inviter_user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("invite_allowance" as any).eq("id", user.id).maybeSingle(),
    ]);
    setInvites(((inv as any) ?? []) as Invite[]);
    setAllowance(((prof as any)?.invite_allowance ?? ALLOWANCE_DEFAULT) as number);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const usedCount = invites.filter(i => i.status === "used").length;
  const pendingCount = invites.filter(i => i.status === "pending" || i.status === "claimed").length;
  const remaining = Math.max(0, allowance - usedCount);

  const createInvite = useCallback(async (payload: {
    invite_type: InviteType; invitee_email?: string; invitee_phone?: string;
  }) => {
    const { data, error } = await supabase.rpc("create_invite" as any, {
      _invite_type: payload.invite_type,
      _invitee_email: payload.invitee_email ?? null,
      _invitee_phone: payload.invitee_phone ?? null,
    });
    if (error) throw error;
    await reload();
    return data as unknown as Invite;
  }, [reload]);

  const revokeInvite = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("revoke_invite" as any, { _invite_id: id });
    if (error) throw error;
    await reload();
  }, [reload]);

  return { invites, allowance, usedCount, pendingCount, remaining, loading, reload, createInvite, revokeInvite };
};

export const validateInviteCode = async (code: string, email?: string, phone?: string) => {
  const { data, error } = await supabase.rpc("validate_invite_code" as any, {
    _code: code, _email: email ?? null, _phone: phone ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as { valid: boolean; reason: string; inviter_username: string | null; invite_id: string | null };
};

export const consumeInvite = async (code: string) => {
  const { data, error } = await supabase.rpc("consume_invite" as any, { _code: code });
  if (error) throw error;
  return data;
};

export const claimInvite = async (code: string) => {
  await supabase.rpc("claim_invite" as any, { _code: code });
};
