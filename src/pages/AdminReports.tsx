import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Flag, Search, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Report = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  severity: string;
  status: string;
  created_at: string;
  resolution: string | null;
  resolution_notes: string | null;
};

const STATUSES = ["open", "investigating", "resolved", "dismissed", "escalated"];
const TYPES = ["all", "listing", "user", "message", "post"];
const SEVERITY_TONE: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-primary/20 text-primary",
  normal: "bg-muted",
  low: "bg-muted/50 text-muted-foreground",
};

const AdminReports = () => {
  const [rows, setRows] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<"newest" | "risk">("risk");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Report | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status);
    if (type !== "all") q = q.eq("target_type", type);
    const { data } = await q;
    const reports = (data ?? []) as Report[];
    setRows(reports);
    const ids = Array.from(new Set(reports.map((r) => r.reporter_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      const m: Record<string, any> = {};
      (profs ?? []).forEach((p) => { m[p.id] = p; });
      setProfiles(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [status, type]);

  const filtered = useMemo(() => {
    let r = rows;
    if (query) {
      const q = query.toLowerCase();
      r = r.filter((x) => x.target_id.includes(q) || x.reason.includes(q) || (x.details ?? "").toLowerCase().includes(q));
    }
    if (sort === "risk") {
      const order = { critical: 0, high: 1, normal: 2, low: 3 } as any;
      r = [...r].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
    }
    return r;
  }, [rows, query, sort]);

  return (
    <AdminShell title="Reports">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by id, reason, details…" className="pl-9 neo-card-inset border-0" />
        </div>
        <Select value={status} onChange={setStatus} options={["all", ...STATUSES]} />
        <Select value={type} onChange={setType} options={TYPES} />
        <Select value={sort} onChange={(v) => setSort(v as any)} options={["risk", "newest"]} labelPrefix="Sort:" />
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}</Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="neo-card p-10 rounded-2xl text-center text-muted-foreground">No reports match.</div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setActive(r)}
              className="neo-card rounded-2xl p-3 text-left flex flex-wrap items-center gap-3 hover:translate-y-[-1px] transition">
              <Badge className={SEVERITY_TONE[r.severity]}>{r.severity}</Badge>
              <Badge variant="outline">{r.status}</Badge>
              <Badge variant="secondary">{r.target_type}</Badge>
              <span className="font-medium capitalize">{r.reason.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground truncate flex-1">
                by {profiles[r.reporter_id]?.username ?? r.reporter_id.slice(0, 6)} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </span>
              {r.details && <span className="text-xs text-muted-foreground truncate max-w-[40%]">{r.details}</span>}
            </button>
          ))}
        </div>
      )}

      <ReportActionDialog report={active} onClose={() => setActive(null)} onChanged={load} />
    </AdminShell>
  );
};

const Select = ({ value, onChange, options, labelPrefix }: { value: string; onChange: (v: string) => void; options: string[]; labelPrefix?: string }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="neo-card-inset rounded-full px-3 py-2 text-xs border-0 bg-transparent">
    {options.map((o) => <option key={o} value={o}>{labelPrefix ? labelPrefix + " " : ""}{o}</option>)}
  </select>
);

const ReportActionDialog = ({ report, onClose, onChanged }: { report: Report | null; onClose: () => void; onChanged: () => void }) => {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [warnReason, setWarnReason] = useState("violation of marketplace policy");

  if (!report) return null;

  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw error;
      toast({ title: `Done: ${label}` });
      onChanged(); onClose();
    } catch (e: any) {
      toast({ title: `Failed: ${label}`, description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setNotes("");
    }
  };

  const resolve = (status: string, resolution: string) =>
    run(`Report ${status}`, () => supabase.rpc("resolve_report", {
      _report_id: report.id, _status: status, _resolution: resolution, _notes: notes || null,
    }));

  const removeListing = () => {
    if (report.target_type !== "listing") return;
    run("Listing removed", async () => {
      await supabase.rpc("remove_listing", { _listing_id: report.target_id, _reason: notes || report.reason });
      return supabase.rpc("resolve_report", { _report_id: report.id, _status: "resolved", _resolution: "listing_removed", _notes: notes || null });
    });
  };

  const warnSeller = async () => {
    if (report.target_type !== "user" && report.target_type !== "listing") return;
    let userId = report.target_id;
    if (report.target_type === "listing") {
      const { data } = await supabase.from("listings").select("seller_id").eq("id", report.target_id).maybeSingle();
      if (!data) { toast({ title: "Listing not found", variant: "destructive" }); return; }
      userId = data.seller_id;
    }
    run("Seller warned", async () => {
      await supabase.rpc("warn_seller", { _user_id: userId, _reason: warnReason, _details: notes || null });
      return supabase.rpc("resolve_report", { _report_id: report.id, _status: "resolved", _resolution: "seller_warned", _notes: notes || null });
    });
  };

  const suspendSeller = async () => {
    let userId = report.target_id;
    if (report.target_type === "listing") {
      const { data } = await supabase.from("listings").select("seller_id").eq("id", report.target_id).maybeSingle();
      if (!data) { toast({ title: "Listing not found", variant: "destructive" }); return; }
      userId = data.seller_id;
    }
    run("Seller suspended", async () => {
      await supabase.rpc("suspend_seller", { _user_id: userId, _reason: report.reason, _notes: notes || null });
      return supabase.rpc("resolve_report", { _report_id: report.id, _status: "resolved", _resolution: "seller_suspended", _notes: notes || null });
    });
  };

  const banAccount = async () => {
    let userId = report.target_id;
    if (report.target_type === "listing") {
      const { data } = await supabase.from("listings").select("seller_id").eq("id", report.target_id).maybeSingle();
      if (!data) return;
      userId = data.seller_id;
    }
    run("Account banned", async () => {
      await supabase.rpc("flag_account", { _user_id: userId, _flag: "banned", _reason: report.reason });
      await supabase.rpc("suspend_seller", { _user_id: userId, _reason: "banned: " + report.reason, _notes: notes || null });
      return supabase.rpc("resolve_report", { _report_id: report.id, _status: "resolved", _resolution: "account_banned", _notes: notes || null });
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="neo-card border-0 max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-primary" /> Report · {report.reason}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="neo-card-inset rounded-2xl p-3 space-y-1">
            <div className="flex gap-2 flex-wrap">
              <Badge className={SEVERITY_TONE[report.severity]}>{report.severity}</Badge>
              <Badge variant="outline">{report.status}</Badge>
              <Badge variant="secondary">{report.target_type}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Target: <code>{report.target_id}</code></div>
            {report.details && <p className="text-sm">{report.details}</p>}
          </div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Moderation notes (private)"
            className="neo-card-inset border-0" rows={3} maxLength={1000} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => resolve("dismissed", "no_violation")}>Dismiss</Button>
            <Button variant="outline" disabled={busy} onClick={() => resolve("escalated", "needs_review")}>Escalate</Button>
            {report.target_type === "listing" && (
              <Button variant="destructive" disabled={busy} onClick={removeListing}>Remove listing</Button>
            )}
            <Button disabled={busy} onClick={warnSeller}>Warn seller</Button>
            <Button variant="destructive" disabled={busy} onClick={suspendSeller}>Suspend seller</Button>
            <Button variant="destructive" disabled={busy} onClick={banAccount}>Ban account</Button>
          </div>
          {busy && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Working…</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminReports;
