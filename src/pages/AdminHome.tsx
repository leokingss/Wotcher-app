import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Flag, AlertOctagon, Wallet, Users, TrendingDown, ShieldAlert, Loader2 } from "lucide-react";

interface Stats {
  openReports: number;
  criticalReports: number;
  openDisputes: number;
  heldPayouts: number;
  heldAmountCents: number;
  highRiskSellers: number;
  refundRate7d: number;
  scamAlerts: number;
}

const AdminHome = () => {
  const [s, setS] = useState<Stats | null>(null);
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    (async () => {
      const since7d = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [reports, critical, disputes, held, sellers, refunds, sales, scam, audit] = await Promise.all([
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open").eq("severity", "critical"),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("marketplace_orders").select("seller_net_cents").in("payout_status", ["pending_release", "held"]),
        supabase.from("seller_trust_scores").select("user_id", { count: "exact", head: true }).in("risk_level", ["high", "critical"]),
        supabase.from("marketplace_orders").select("id", { count: "exact", head: true }).gte("refunded_at", since7d),
        supabase.from("marketplace_orders").select("id", { count: "exact", head: true }).gte("paid_at", since7d),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open").eq("reason", "scam"),
        supabase.from("admin_audit_log").select("id", { count: "exact", head: true }).gte("created_at", since7d),
      ]);
      const heldAmount = (held.data ?? []).reduce((a, r) => a + (r.seller_net_cents ?? 0), 0);
      const refundRate = sales.count ? ((refunds.count ?? 0) / sales.count) * 100 : 0;
      setS({
        openReports: reports.count ?? 0,
        criticalReports: critical.count ?? 0,
        openDisputes: disputes.count ?? 0,
        heldPayouts: (held.data ?? []).length,
        heldAmountCents: heldAmount,
        highRiskSellers: sellers.count ?? 0,
        refundRate7d: refundRate,
        scamAlerts: scam.count ?? 0,
      });
      setAuditCount(audit.count ?? 0);
    })();
  }, []);

  return (
    <AdminShell title="Overview">
      {!s ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin w-4 h-4" /> Loading metrics…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={Flag} label="Open reports" value={s.openReports} hint={`${s.criticalReports} critical`} to="/admin/reports" />
          <Stat icon={AlertOctagon} label="Open disputes" value={s.openDisputes} to="/admin/disputes" tone={s.openDisputes ? "warn" : undefined} />
          <Stat icon={Wallet} label="Held payouts" value={s.heldPayouts}
            hint={`$${(s.heldAmountCents / 100).toFixed(2)} pending`} to="/admin/orders" />
          <Stat icon={ShieldAlert} label="High-risk sellers" value={s.highRiskSellers} to="/admin/sellers"
            tone={s.highRiskSellers ? "warn" : undefined} />
          <Stat icon={TrendingDown} label="Refund rate (7d)" value={`${s.refundRate7d.toFixed(1)}%`} />
          <Stat icon={Flag} label="Scam alerts" value={s.scamAlerts} to="/admin/reports?reason=scam"
            tone={s.scamAlerts ? "danger" : undefined} />
          <Stat icon={Users} label="Admin actions (7d)" value={auditCount} />
        </div>
      )}

      <section className="mt-8 grid lg:grid-cols-2 gap-4">
        <QuickLink to="/admin/reports" title="Triage reports" desc="Resolve open reports, remove listings, warn or suspend sellers." />
        <QuickLink to="/admin/disputes" title="Resolve disputes" desc="Refund buyers, release seller payouts, mark resolved." />
        <QuickLink to="/admin/orders" title="Manage payouts" desc="See held funds, extend holds, release early, flag high risk." />
        <QuickLink to="/admin/sellers" title="Seller register" desc="Verification, suspensions, trust scores." />
      </section>
    </AdminShell>
  );
};

const Stat = ({ icon: I, label, value, hint, to, tone }: { icon: any; label: string; value: any; hint?: string; to?: string; tone?: "warn" | "danger" }) => {
  const inner = (
    <div className={`neo-card rounded-2xl p-4 h-full ${tone === "danger" ? "ring-2 ring-destructive/40" : tone === "warn" ? "ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide"><I className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const QuickLink = ({ to, title, desc }: { to: string; title: string; desc: string }) => (
  <Link to={to} className="neo-card rounded-2xl p-4 hover:translate-y-[-1px] transition">
    <div className="font-semibold">{title}</div>
    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
  </Link>
);

export default AdminHome;
