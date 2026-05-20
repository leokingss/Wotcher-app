import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { formatRelative } from "@/lib/time";

interface Row {
  id: string; code: string; status: string; invite_type: string;
  invitee_email: string | null; invitee_phone: string | null;
  created_at: string; used_at: string | null; expires_at: string;
  inviter_user_id: string; invitee_user_id: string | null;
  inviter_username?: string | null; invitee_username?: string | null;
}

const AdminInvites = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: aLoading } = useIsAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [grantUser, setGrantUser] = useState("");
  const [grantAmt, setGrantAmt] = useState(5);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("invites" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    const list = ((data as any) ?? []) as Row[];
    const ids = Array.from(new Set(list.flatMap(r => [r.inviter_user_id, r.invitee_user_id]).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map = new Map((profs ?? []).map(p => [p.id, p.username]));
      list.forEach(r => {
        r.inviter_username = map.get(r.inviter_user_id) ?? null;
        r.invitee_username = r.invitee_user_id ? map.get(r.invitee_user_id) ?? null : null;
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, statusFilter]);

  if (aLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Admins only</div>;

  const revoke = async (id: string) => {
    if (!confirm("Revoke invite?")) return;
    const { error } = await supabase.rpc("revoke_invite" as any, { _invite_id: id });
    if (error) toast.error(error.message); else { toast.success("Revoked"); load(); }
  };

  const grant = async () => {
    if (!grantUser) return toast.error("Enter a user id");
    const { error } = await supabase.rpc("grant_extra_invites" as any, { _user_id: grantUser, _extra: grantAmt });
    if (error) toast.error(error.message); else { toast.success("Allowance granted"); setGrantUser(""); }
  };

  const stats = {
    total: rows.length,
    used: rows.filter(r => r.status === "used").length,
    pending: rows.filter(r => r.status === "pending" || r.status === "claimed").length,
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="neo-button-icon p-2 mb-4">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Invites</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage invite codes, conversion, and allowances.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Total" value={stats.total} />
        <Stat label="Joined" value={stats.used} accent />
        <Stat label="Pending" value={stats.pending} />
      </div>

      <section className="neo-card rounded-3xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Grant extra invites</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="User id (uuid)"
            value={grantUser} onChange={(e) => setGrantUser(e.target.value)}
            className="neo-card-inset flex-1 px-4 py-3 rounded-xl bg-transparent outline-none text-sm font-mono"
          />
          <input
            type="number" min={1} max={500}
            value={grantAmt} onChange={(e) => setGrantAmt(parseInt(e.target.value) || 1)}
            className="neo-card-inset w-24 px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
          />
          <button onClick={grant} className="action-button action-button-primary px-5">Grant</button>
        </div>
      </section>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {["all", "pending", "claimed", "used", "expired", "revoked"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-medium ${statusFilter === s ? "neo-card-inset text-primary" : "neo-button-icon"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        rows.length === 0 ? <p className="text-sm text-muted-foreground">No invites match.</p> :
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="neo-card rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  <span className="font-mono mr-2">{r.code}</span>
                  <span className="text-muted-foreground">→ {r.invitee_email ?? r.invitee_phone ?? "share link"}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  by @{r.inviter_username ?? r.inviter_user_id.slice(0, 8)}
                  {r.invitee_username && <> · joined as @{r.invitee_username}</>}
                  {" · "}{r.status} · {formatRelative(r.created_at)}
                </div>
              </div>
              {(r.status === "pending" || r.status === "claimed") && (
                <button onClick={() => revoke(r.id)} className="neo-button-icon p-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className="neo-card rounded-2xl p-4 text-center">
    <div className={`text-2xl font-bold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
  </div>
);

export default AdminInvites;
