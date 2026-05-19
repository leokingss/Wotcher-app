import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertOctagon, Loader2, Truck, CreditCard, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Dispute = {
  id: string; order_id: string; buyer_id: string; seller_id: string; source: string;
  reason: string; details: string | null; status: string; created_at: string; resolved_at: string | null;
};
type Order = {
  id: string; amount_cents: number; seller_net_cents: number; currency: string;
  status: string; payout_status: string; tracking_number: string | null; carrier: string | null;
  shipped_at: string | null; delivered_at: string | null;
};

const AdminDisputes = () => {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [status, setStatus] = useState("open");
  const [active, setActive] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("disputes").select("*").order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    const ds = (data ?? []) as Dispute[];
    setRows(ds);
    const orderIds = Array.from(new Set(ds.map((d) => d.order_id)));
    const userIds = Array.from(new Set(ds.flatMap((d) => [d.buyer_id, d.seller_id])));
    if (orderIds.length) {
      const { data: os } = await supabase.from("marketplace_orders").select("*").in("id", orderIds);
      const m: Record<string, Order> = {}; (os ?? []).forEach((o: any) => { m[o.id] = o; });
      setOrders(m);
    }
    if (userIds.length) {
      const { data: ps } = await supabase.from("profiles").select("id, username, display_name").in("id", userIds);
      const m: Record<string, any> = {}; (ps ?? []).forEach((p) => { m[p.id] = p; });
      setProfiles(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [status]);

  return (
    <AdminShell title="Disputes">
      <div className="flex gap-2 mb-4">
        {["open", "refunded", "resolved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s ? "neo-button-icon-active" : "neo-card-inset text-muted-foreground"}`}>
            {s}
          </button>
        ))}
        <Button variant="outline" onClick={load} className="ml-auto" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="neo-card p-10 rounded-2xl text-center text-muted-foreground">No disputes.</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((d) => {
            const o = orders[d.order_id];
            return (
              <button key={d.id} onClick={() => setActive(d)} className="neo-card rounded-2xl p-3 text-left flex flex-wrap items-center gap-3 hover:translate-y-[-1px] transition">
                <AlertOctagon className="w-4 h-4 text-destructive" />
                <Badge variant={d.status === "open" ? "destructive" : "outline"}>{d.status}</Badge>
                <span className="font-medium capitalize">{d.reason.replace("_", " ")}</span>
                {o && <Badge variant="secondary">${(o.amount_cents / 100).toFixed(2)} · {o.currency.toUpperCase()}</Badge>}
                {o && <Badge variant="outline">payout: {o.payout_status}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {profiles[d.buyer_id]?.username ?? "buyer"} vs {profiles[d.seller_id]?.username ?? "seller"} · {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <DisputeDialog dispute={active} order={active ? orders[active.order_id] : undefined}
        buyer={active ? profiles[active.buyer_id] : undefined} seller={active ? profiles[active.seller_id] : undefined}
        onClose={() => setActive(null)} onChanged={load} />
    </AdminShell>
  );
};

const DisputeDialog = ({ dispute, order, buyer, seller, onClose, onChanged }: any) => {
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (!dispute) return null;
  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(true);
    try { const r = await fn(); if (r?.error) throw r.error;
      toast({ title: `Done: ${label}` }); onChanged(); onClose();
    } catch (e: any) { toast({ title: `Failed: ${label}`, description: e.message, variant: "destructive" }); }
    finally { setBusy(false); setNotes(""); setAmount(""); }
  };

  const refund = (full: boolean) => run(full ? "Full refund" : "Partial refund", async () => {
    const cents = full ? undefined : Math.round(Number(amount) * 100);
    return supabase.functions.invoke("refund-order", {
      body: { order_id: dispute.order_id, reason: notes || dispute.reason, amount_cents: cents },
    });
  });
  const release = () => run("Payout released", () => supabase.functions.invoke("admin-payout-action", {
    body: { order_id: dispute.order_id, action: "release", notes },
  }));
  const extend = () => run("Hold extended 7 days", () => supabase.functions.invoke("admin-payout-action", {
    body: { order_id: dispute.order_id, action: "extend_hold", days: 7, notes },
  }));
  const markResolved = () => run("Dispute resolved", async () =>
    supabase.from("disputes").update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_notes: notes || null }).eq("id", dispute.id));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="neo-card border-0 max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-destructive" /> Dispute · {dispute.reason}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Info label="Buyer" value={buyer?.username ?? dispute.buyer_id.slice(0, 8)} />
            <Info label="Seller" value={seller?.username ?? dispute.seller_id.slice(0, 8)} />
            {order && <>
              <Info label="Gross" value={`$${(order.amount_cents / 100).toFixed(2)}`} icon={CreditCard} />
              <Info label="Seller net" value={`$${(order.seller_net_cents / 100).toFixed(2)}`} icon={Wallet} />
              <Info label="Order status" value={order.status} />
              <Info label="Payout status" value={order.payout_status} />
              <Info label="Shipped" value={order.shipped_at ? formatDistanceToNow(new Date(order.shipped_at), { addSuffix: true }) : "—"} icon={Truck} />
              <Info label="Delivered" value={order.delivered_at ? formatDistanceToNow(new Date(order.delivered_at), { addSuffix: true }) : "—"} />
              {order.tracking_number && <Info label="Tracking" value={`${order.carrier ?? ""} ${order.tracking_number}`} />}
            </>}
          </div>
          {dispute.details && <p className="neo-card-inset rounded-2xl p-3">{dispute.details}</p>}
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="neo-card-inset border-0" rows={2} placeholder="Resolution notes" maxLength={1000} />
          <div className="flex items-center gap-2">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Partial $" className="neo-card-inset border-0 max-w-[120px]" inputMode="decimal" />
            <Button variant="destructive" disabled={busy || !amount} onClick={() => refund(false)}>Partial refund</Button>
            <Button variant="destructive" disabled={busy} onClick={() => refund(true)}>Full refund</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" disabled={busy} onClick={extend}>Extend hold</Button>
            <Button variant="outline" disabled={busy} onClick={release}>Release payout</Button>
            <Button disabled={busy} onClick={markResolved}>Mark resolved</Button>
          </div>
          {busy && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Working…</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Info = ({ label, value, icon: I }: { label: string; value: any; icon?: any }) => (
  <div className="neo-card-inset rounded-xl p-2.5">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">{I && <I className="w-3 h-3" />} {label}</div>
    <div className="font-medium truncate">{value}</div>
  </div>
);

export default AdminDisputes;
