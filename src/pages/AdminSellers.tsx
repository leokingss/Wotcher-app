import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldOff, ShieldCheck, AlertTriangle, Search } from "lucide-react";

interface SellerRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  charges_enabled?: boolean;
  identity_verified?: boolean;
  suspended?: boolean;
  suspension_reason?: string | null;
  orders_count?: number;
  gross_cents?: number;
}

const AdminSellers = () => {
  const { isAdmin, loading: aLoading } = useIsAdmin();
  const [rows, setRows] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // Sellers = any user with at least one listing OR a stripe account row
    const { data: accounts } = await supabase
      .from("seller_stripe_accounts")
      .select("user_id, charges_enabled");
    const { data: idents } = await supabase
      .from("seller_identity_verifications")
      .select("user_id, status");
    const { data: susp } = await supabase
      .from("seller_suspensions")
      .select("user_id, reason, lifted_at")
      .is("lifted_at", null);
    const { data: orders } = await supabase
      .from("marketplace_orders")
      .select("seller_id, amount_cents, status");

    const sellerIds = new Set<string>([
      ...(accounts ?? []).map((a) => a.user_id),
      ...(idents ?? []).map((i) => i.user_id),
      ...(orders ?? []).map((o) => o.seller_id),
    ]);
    if (sellerIds.size === 0) { setRows([]); setLoading(false); return; }

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", Array.from(sellerIds));

    const acctMap = new Map((accounts ?? []).map((a) => [a.user_id, a]));
    const idMap = new Map((idents ?? []).map((i) => [i.user_id, i]));
    const suspMap = new Map((susp ?? []).map((s) => [s.user_id, s]));
    const orderStats = new Map<string, { count: number; gross: number }>();
    (orders ?? []).forEach((o) => {
      if (o.status !== "paid") return;
      const cur = orderStats.get(o.seller_id) ?? { count: 0, gross: 0 };
      cur.count++; cur.gross += o.amount_cents ?? 0;
      orderStats.set(o.seller_id, cur);
    });

    const merged: SellerRow[] = (profs ?? []).map((p) => {
      const stats = orderStats.get(p.id);
      return {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        charges_enabled: acctMap.get(p.id)?.charges_enabled,
        identity_verified: idMap.get(p.id)?.status === "verified",
        suspended: suspMap.has(p.id),
        suspension_reason: suspMap.get(p.id)?.reason ?? null,
        orders_count: stats?.count ?? 0,
        gross_cents: stats?.gross ?? 0,
      };
    });
    merged.sort((a, b) => (b.gross_cents ?? 0) - (a.gross_cents ?? 0));
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const suspend = async (s: SellerRow) => {
    const reason = window.prompt(`Suspend ${s.username ?? s.id}? Enter reason:`);
    if (!reason) return;
    setBusyId(s.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("seller_suspensions").insert({
      user_id: s.id, reason, suspended_by: u.user!.id,
    });
    setBusyId(null);
    if (error) toast({ title: "Couldn't suspend", description: error.message, variant: "destructive" });
    else { toast({ title: "Seller suspended" }); load(); }
  };

  const lift = async (s: SellerRow) => {
    if (!confirm(`Lift suspension for ${s.username ?? s.id}?`)) return;
    setBusyId(s.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("seller_suspensions")
      .update({ lifted_at: new Date().toISOString(), lifted_by: u.user!.id })
      .eq("user_id", s.id)
      .is("lifted_at", null);
    setBusyId(null);
    if (error) toast({ title: "Couldn't lift", description: error.message, variant: "destructive" });
    else { toast({ title: "Suspension lifted" }); load(); }
  };

  if (aLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-6 text-destructive">Admins only.</div>;

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (r.username ?? "").toLowerCase().includes(q)
      || (r.display_name ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-5xl mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-1">Seller moderation</h1>
      <p className="text-muted-foreground mb-4">
        Review KYC status, payouts, and suspend sellers from selling on the platform.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sellers"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading sellers…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No sellers found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
              <div className="size-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {s.avatar_url && <img src={s.avatar_url} alt="" className="size-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.display_name ?? s.username ?? s.id}</div>
                <div className="text-xs text-muted-foreground truncate">@{s.username ?? "—"}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge ok={s.identity_verified}>ID {s.identity_verified ? "verified" : "missing"}</Badge>
                  <Badge ok={s.charges_enabled}>Payouts {s.charges_enabled ? "active" : "not ready"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {s.orders_count} sales · ${((s.gross_cents ?? 0) / 100).toFixed(0)} gross
                  </span>
                </div>
                {s.suspended && (
                  <div className="flex items-start gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertTriangle className="size-3.5 mt-0.5" />
                    Suspended: {s.suspension_reason}
                  </div>
                )}
              </div>
              {s.suspended ? (
                <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => lift(s)}>
                  <ShieldCheck className="size-4 mr-1.5" /> Lift
                </Button>
              ) : (
                <Button size="sm" variant="destructive" disabled={busyId === s.id} onClick={() => suspend(s)}>
                  <ShieldOff className="size-4 mr-1.5" /> Suspend
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Badge = ({ ok, children }: { ok?: boolean; children: React.ReactNode }) => (
  <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
    ok ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
  }`}>{children}</span>
);

export default AdminSellers;
