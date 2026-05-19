import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Wallet, Clock, AlertOctagon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Order = {
  id: string; listing_id: string; buyer_id: string; seller_id: string;
  amount_cents: number; seller_net_cents: number; currency: string;
  status: string; payout_status: string;
  release_after: string | null; delivered_at: string | null;
  paid_at: string | null; disputed_at: string | null;
};
type Trust = { user_id: string; trust_score: number; risk_level: string };

const PAYOUT_STATUSES = ["all", "pending_release", "held", "released", "refunded", "disputed"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [trust, setTrust] = useState<Record<string, Trust>>({});
  const [status, setStatus] = useState("pending_release");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("marketplace_orders").select("*").order("paid_at", { ascending: false, nullsFirst: false }).limit(500);
    if (status !== "all") q = q.eq("payout_status", status);
    const { data } = await q;
    const os = (data ?? []) as Order[];
    setOrders(os);
    const sellerIds = Array.from(new Set(os.map((o) => o.seller_id)));
    if (sellerIds.length) {
      const [{ data: ps }, { data: ts }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").in("id", sellerIds),
        supabase.from("seller_trust_scores").select("user_id, trust_score, risk_level").in("user_id", sellerIds),
      ]);
      const mp: Record<string, any> = {}; (ps ?? []).forEach((p) => { mp[p.id] = p; });
      const mt: Record<string, Trust> = {}; (ts ?? []).forEach((t: any) => { mt[t.user_id] = t; });
      setProfiles(mp); setTrust(mt);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [status]);

  const filtered = orders.filter((o) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const p = profiles[o.seller_id];
    return o.id.includes(q) || (p?.username ?? "").toLowerCase().includes(q);
  });

  const totalHeld = filtered.reduce((a, o) => o.payout_status === "pending_release" || o.payout_status === "held" ? a + o.seller_net_cents : a, 0);

  const act = async (order: Order, action: "release" | "extend_hold", days = 7) => {
    setBusyId(order.id);
    const { error } = await supabase.functions.invoke("admin-payout-action", {
      body: { order_id: order.id, action, days, notes: null },
    });
    setBusyId(null);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: action === "release" ? "Payout released" : `Hold extended ${days}d` });
    load();
  };

  const freezeSeller = async (sellerId: string) => {
    setBusyId(sellerId);
    const { error } = await supabase.rpc("suspend_seller", { _user_id: sellerId, _reason: "admin freeze from orders queue", _notes: null });
    setBusyId(null);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Seller frozen" });
  };

  const flagHigh = async (sellerId: string) => {
    setBusyId(sellerId);
    const { error } = await supabase.rpc("flag_account", { _user_id: sellerId, _flag: "high_risk", _reason: "marked from orders queue" });
    setBusyId(null);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Seller flagged high risk" }); load();
  };

  const refund = async (order: Order) => {
    setBusyId(order.id);
    const { error } = await supabase.functions.invoke("refund-order", { body: { order_id: order.id, reason: "admin refund" } });
    setBusyId(null);
    if (error) { toast({ title: "Refund failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Refunded" }); load();
  };

  return (
    <AdminShell title="Orders & Payouts">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex gap-1">
          {PAYOUT_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s ? "neo-button-icon-active" : "neo-card-inset text-muted-foreground"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search seller or order id" className="max-w-xs neo-card-inset border-0" />
        <div className="ml-auto neo-card-inset rounded-full px-4 py-1.5 text-xs flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5" /> Total held: <span className="font-bold">${(totalHeld / 100).toFixed(2)}</span>
        </div>
      </div>

      {loading ? <div className="text-muted-foreground"><Loader2 className="inline animate-spin w-4 h-4" /> Loading…</div>
        : filtered.length === 0 ? <div className="neo-card p-10 rounded-2xl text-center text-muted-foreground">No orders.</div>
        : (
          <div className="grid gap-2">
            {filtered.map((o) => {
              const t = trust[o.seller_id];
              const seller = profiles[o.seller_id];
              const releaseDue = o.release_after ? new Date(o.release_after).getTime() < Date.now() : false;
              return (
                <div key={o.id} className="neo-card rounded-2xl p-3 grid md:grid-cols-[1fr_auto] gap-3 items-center">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{o.status}</Badge>
                    <Badge variant={o.payout_status === "released" ? "default" : o.payout_status === "refunded" || o.payout_status === "disputed" ? "destructive" : "secondary"}>
                      {o.payout_status}
                    </Badge>
                    <span className="font-semibold">${(o.amount_cents / 100).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">net ${(o.seller_net_cents / 100).toFixed(2)}</span>
                    <span className="text-xs">seller: <span className="font-medium">{seller?.username ?? o.seller_id.slice(0, 6)}</span></span>
                    {t && <Badge className={t.risk_level === "critical" || t.risk_level === "high" ? "bg-destructive/20 text-destructive" : t.risk_level === "low" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted"}>
                      <ShieldAlert className="w-3 h-3 mr-1" /> {t.risk_level} · {t.trust_score}
                    </Badge>}
                    {o.disputed_at && <Badge variant="destructive"><AlertOctagon className="w-3 h-3 mr-1" /> disputed</Badge>}
                    {o.release_after && <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {releaseDue ? "release due" : `releases ${formatDistanceToNow(new Date(o.release_after), { addSuffix: true })}`}
                    </span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" disabled={busyId === o.id || !["pending_release", "held"].includes(o.payout_status)} onClick={() => act(o, "release")}>Release</Button>
                    <Button size="sm" variant="outline" disabled={busyId === o.id} onClick={() => act(o, "extend_hold", 7)}>+7d</Button>
                    <Button size="sm" variant="destructive" disabled={busyId === o.id || !["paid", "shipped", "delivered"].includes(o.status)} onClick={() => refund(o)}>Refund</Button>
                    <Button size="sm" variant="ghost" disabled={busyId === o.seller_id} onClick={() => flagHigh(o.seller_id)}>Flag risk</Button>
                    <Button size="sm" variant="ghost" disabled={busyId === o.seller_id} onClick={() => freezeSeller(o.seller_id)}>Freeze</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </AdminShell>
  );
};

export default AdminOrders;
