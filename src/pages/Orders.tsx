import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Package, Truck, CheckCircle2, Clock, XCircle, ExternalLink, AlertTriangle, Undo2,
} from "lucide-react";

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  kind: string;
  amount_cents: number;
  platform_fee_cents: number;
  seller_net_cents: number;
  currency: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  created_at: string;
  shipping: any;
  disputed_at?: string | null;
  refunded_at?: string | null;
  refund_amount_cents?: number | null;
  listing?: { title: string } | null;
  counterparty?: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  open_dispute?: { id: string; reason: string; status: string } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipDialog, setShipDialog] = useState<Order | null>(null);
  const [disputeDialog, setDisputeDialog] = useState<Order | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("marketplace_orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("marketplace_orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    const all = [...(p ?? []), ...(s ?? [])];
    const listingIds = Array.from(new Set(all.map((o) => o.listing_id)));
    const userIds = Array.from(new Set(all.flatMap((o) => [o.buyer_id, o.seller_id]).filter((id) => id !== user.id)));

    const orderIds = all.map((o) => o.id);
    const [{ data: listings }, { data: profs }, { data: openDisputes }] = await Promise.all([
      listingIds.length
        ? supabase.from("listings").select("id, title").in("id", listingIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      orderIds.length
        ? supabase.from("disputes").select("id, order_id, reason, status").in("order_id", orderIds).eq("status", "open")
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const lMap = new Map((listings ?? []).map((l: any) => [l.id, l]));
    const uMap = new Map((profs ?? []).map((u: any) => [u.id, u]));
    const dMap = new Map((openDisputes ?? []).map((d: any) => [d.order_id, d]));

    const hydrate = (o: any, counterId: string): Order => ({
      ...o,
      listing: lMap.get(o.listing_id) ?? null,
      counterparty: uMap.get(counterId) ?? null,
      open_dispute: dMap.get(o.id) ?? null,
    });

    setPurchases((p ?? []).map((o) => hydrate(o, o.seller_id)));
    setSales((s ?? []).map((o) => hydrate(o, o.buyer_id)));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user?.id]);

  const markDelivered = async (o: Order) => {
    if (!confirm(`Confirm you received "${o.listing?.title ?? "this item"}"?`)) return;
    const { error } = await supabase.rpc("mark_order_delivered", { _order_id: o.id });
    if (error) toast({ title: "Couldn't confirm", description: error.message, variant: "destructive" });
    else { toast({ title: "Marked as delivered" }); load(); }
  };

  const refund = async (o: Order) => {
    if (!confirm(`Refund full amount $${(o.amount_cents / 100).toFixed(2)} to buyer? This reverses the transfer to your payout account.`)) return;
    const reason = window.prompt("Optional reason for refund:") ?? "";
    const { error } = await supabase.functions.invoke("refund-order", {
      body: { order_id: o.id, reason },
    });
    if (error) toast({ title: "Refund failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Refund issued" }); load(); }
  };

  if (!user) return <div className="p-6 text-muted-foreground">Sign in to view your orders.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-1">Orders</h1>
      <p className="text-muted-foreground mb-4">Track your purchases and manage your sales.</p>

      <Tabs defaultValue="purchases">
        <TabsList className="mb-4">
          <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
          <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          {loading ? <Skeleton /> : purchases.length === 0 ? (
            <Empty text="You haven't bought anything yet." />
          ) : (
            <div className="space-y-3">
              {purchases.map((o) => (
                <OrderCard key={o.id} order={o} side="buyer"
                  onMarkDelivered={() => markDelivered(o)}
                  onDispute={() => setDisputeDialog(o)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales">
          {loading ? <Skeleton /> : sales.length === 0 ? (
            <Empty text="You haven't sold anything yet." />
          ) : (
            <div className="space-y-3">
              {sales.map((o) => (
                <OrderCard key={o.id} order={o} side="seller"
                  onShip={() => setShipDialog(o)}
                  onRefund={() => refund(o)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ShipDialog
        order={shipDialog}
        onClose={() => setShipDialog(null)}
        onShipped={() => { setShipDialog(null); load(); }}
      />
      <DisputeDialog
        order={disputeDialog}
        onClose={() => setDisputeDialog(null)}
        onOpened={() => { setDisputeDialog(null); load(); }}
      />
    </div>
  );
};

const STATUS_META: Record<string, { label: string; icon: any; cls: string }> = {
  pending: { label: "Payment pending", icon: Clock, cls: "text-muted-foreground" },
  paid: { label: "Awaiting shipment", icon: Package, cls: "text-yellow-500" },
  shipped: { label: "Shipped", icon: Truck, cls: "text-primary" },
  delivered: { label: "Delivered", icon: CheckCircle2, cls: "text-primary" },
  canceled: { label: "Canceled", icon: XCircle, cls: "text-destructive" },
  refunded: { label: "Refunded", icon: XCircle, cls: "text-destructive" },
};

const OrderCard = ({ order, side, onShip, onMarkDelivered, onDispute, onRefund }: {
  order: Order; side: "buyer" | "seller";
  onShip?: () => void; onMarkDelivered?: () => void;
  onDispute?: () => void; onRefund?: () => void;
}) => {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  const amount = (order.amount_cents / 100).toFixed(2);
  const net = (order.seller_net_cents / 100).toFixed(2);
  const canRefund = side === "seller" && ["paid", "shipped", "delivered"].includes(order.status) && !order.refunded_at;
  const canDispute = side === "buyer" && ["paid", "shipped", "delivered"].includes(order.status) && !order.open_dispute && !order.refunded_at;

  return (
    <div className="p-4 rounded-xl border bg-card">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{order.listing?.title ?? "Listing"}</div>
          <div className="text-xs text-muted-foreground">
            {side === "buyer" ? "from" : "to"} @{order.counterparty?.username ?? "—"}
            {" · "}{new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">${amount}</div>
          {side === "seller" && (
            <div className="text-xs text-muted-foreground">net ${net}</div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1.5 text-sm ${meta.cls} mb-2`}>
        <Icon className="size-4" /> {meta.label}
        {order.refund_amount_cents ? <span className="text-xs text-muted-foreground">· ${(order.refund_amount_cents / 100).toFixed(2)} refunded</span> : null}
      </div>

      {order.open_dispute && (
        <div className="flex items-start gap-1.5 text-xs text-destructive mb-2 p-2 rounded bg-destructive/10">
          <AlertTriangle className="size-3.5 mt-0.5" />
          <span>Dispute open: {order.open_dispute.reason.replace(/_/g, " ")}</span>
        </div>
      )}

      {order.tracking_number && (
        <div className="text-xs text-muted-foreground mb-2">
          {order.carrier ?? "Tracking"}: <span className="font-mono">{order.tracking_number}</span>
        </div>
      )}

      <Timeline order={order} />

      <div className="flex flex-wrap gap-2 mt-3">
        {side === "seller" && order.status === "paid" && (
          <Button size="sm" onClick={onShip}>
            <Truck className="size-4 mr-1.5" /> Add tracking & mark shipped
          </Button>
        )}
        {side === "buyer" && order.status === "shipped" && (
          <Button size="sm" onClick={onMarkDelivered}>
            <CheckCircle2 className="size-4 mr-1.5" /> Confirm delivery
          </Button>
        )}
        {canDispute && (
          <Button size="sm" variant="outline" onClick={onDispute}>
            <AlertTriangle className="size-4 mr-1.5" /> Open a case
          </Button>
        )}
        {canRefund && (
          <Button size="sm" variant="outline" onClick={onRefund}>
            <Undo2 className="size-4 mr-1.5" /> Refund buyer
          </Button>
        )}
      </div>
    </div>
  );
};

const DISPUTE_REASONS = [
  { value: "not_received", label: "Item not received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "damaged", label: "Arrived damaged" },
  { value: "counterfeit", label: "Counterfeit / inauthentic" },
  { value: "other", label: "Other" },
];

const DisputeDialog = ({ order, onClose, onOpened }: {
  order: Order | null; onClose: () => void; onOpened: () => void;
}) => {
  const [reason, setReason] = useState("not_received");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (order) { setReason("not_received"); setDetails(""); } }, [order?.id]);
  if (!order) return null;

  const submit = async () => {
    if (details.length > 1000) {
      toast({ title: "Details too long (max 1000 chars)", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("open_dispute", {
      _order_id: order.id, _reason: reason, _details: details.trim() || null,
    });
    setBusy(false);
    if (error) toast({ title: "Couldn't open case", description: error.message, variant: "destructive" });
    else { toast({ title: "Case opened — our team will review" }); onOpened(); }
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open a case</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tell us what went wrong with "{order.listing?.title}". The seller and our moderation team will see this.
          </p>
          <div>
            <label className="text-xs text-muted-foreground">Reason</label>
            <select
              value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm"
            >
              {DISPUTE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Details (optional)</label>
            <Textarea
              value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder="Photos, dates, anything that helps explain…"
              maxLength={1000} rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} variant="destructive">
            {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <AlertTriangle className="size-4 mr-2" />}
            Open case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Timeline = ({ order }: { order: Order }) => {
  const steps = [
    { label: "Paid", at: order.paid_at },
    { label: "Shipped", at: order.shipped_at },
    { label: "Delivered", at: order.delivered_at },
  ];
  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex-1 flex items-center gap-1">
          <div className={`h-1 flex-1 rounded-full ${s.at ? "bg-primary" : "bg-muted"}`} />
          {i === steps.length - 1 && (
            <div className={`size-2 rounded-full ${s.at ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const ShipDialog = ({ order, onClose, onShipped }: {
  order: Order | null; onClose: () => void; onShipped: () => void;
}) => {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (order) { setCarrier(""); setTracking(""); }
  }, [order?.id]);

  if (!order) return null;

  const submit = async () => {
    if (!tracking.trim()) {
      toast({ title: "Tracking number required", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("mark_order_shipped", {
      _order_id: order.id,
      _carrier: carrier.trim() || null,
      _tracking_number: tracking.trim(),
    });
    setBusy(false);
    if (error) toast({ title: "Couldn't ship", description: error.message, variant: "destructive" });
    else { toast({ title: "Marked as shipped — buyer notified" }); onShipped(); }
  };

  const ship = order.shipping ?? {};

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ship order</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm">
            <div className="font-medium">{order.listing?.title}</div>
            <div className="text-muted-foreground">to @{order.counterparty?.username}</div>
          </div>
          {ship?.line1 && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <div className="font-medium">{ship.full_name}</div>
              <div>{ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}</div>
              <div>{ship.city}{ship.region ? `, ${ship.region}` : ""} {ship.postal_code}</div>
              <div>{ship.country}</div>
              {ship.phone && <div className="text-muted-foreground">{ship.phone}</div>}
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Carrier (optional)</label>
            <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="USPS, UPS, DHL…" maxLength={50} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tracking number</label>
            <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z..." maxLength={100} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <Truck className="size-4 mr-2" />}
            Mark shipped
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Skeleton = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Loader2 className="size-4 animate-spin" /> Loading orders…
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="text-center py-12 text-muted-foreground">
    <Package className="size-8 mx-auto mb-2 opacity-50" />
    {text}
  </div>
);

export default Orders;
