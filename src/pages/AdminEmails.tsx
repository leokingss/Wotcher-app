import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const RANGES = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

const STATUSES = ["all", "sent", "pending", "dlq", "failed", "suppressed", "bounced", "complained"];

const statusColor = (s: string) => {
  if (s === "sent") return "text-emerald-400";
  if (s === "pending") return "text-yellow-400";
  if (s === "suppressed") return "text-amber-400";
  return "text-red-400";
};

const AdminEmails = () => {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24 * 7);
  const [status, setStatus] = useState("all");
  const [template, setTemplate] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { 
    if (isAdmin) load(); 
  }, [isAdmin, hours]);

  // Deduplicate by message_id (keep latest)
  const dedup = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      const key = r.message_id ?? r.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [rows]);

  const templates = useMemo(
    () => Array.from(new Set(dedup.map((r) => r.template_name))).sort(),
    [dedup]
  );

  const filtered = useMemo(() => {
    return dedup.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (template !== "all" && r.template_name !== template) return false;
      if (search && !r.recipient_email.toLowerCase().includes(search.toLowerCase()) &&
          !(r.message_id ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [dedup, status, template, search]);

  const stats = useMemo(() => {
    const s = { total: filtered.length, sent: 0, failed: 0, suppressed: 0, pending: 0 };
    for (const r of filtered) {
      if (r.status === "sent") s.sent++;
      else if (r.status === "pending") s.pending++;
      else if (r.status === "suppressed") s.suppressed++;
      else s.failed++;
    }
    return s;
  }, [filtered]);

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold flex-1">Email Monitoring</h1>
          <button onClick={load} className="neo-button-icon p-2" aria-label="Refresh">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Sent", value: stats.sent, color: "text-emerald-400" },
            { label: "Pending", value: stats.pending, color: "text-yellow-400" },
            { label: "Failed", value: stats.failed, color: "text-red-400" },
            { label: "Suppressed", value: stats.suppressed, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="neo-card-inset rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex gap-1 neo-card-inset rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setHours(r.hours)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${hours === r.hours ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="neo-card-inset rounded-xl px-3 py-2 text-sm bg-transparent">
            {STATUSES.map((s) => <option key={s} value={s} className="bg-background">{s}</option>)}
          </select>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} className="neo-card-inset rounded-xl px-3 py-2 text-sm bg-transparent">
            <option value="all" className="bg-background">all templates</option>
            {templates.map((t) => <option key={t} value={t} className="bg-background">{t}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient or key…"
            className="neo-card-inset rounded-xl px-3 py-2 text-sm bg-transparent flex-1 min-w-[180px]"
          />
        </div>

        {/* Table */}
        <div className="neo-card-inset rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground tracking-wider">
                <tr className="border-b border-border">
                  <th className="text-left p-3">When</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Template</th>
                  <th className="text-left p-3">Recipient</th>
                  <th className="text-left p-3">Idempotency Key</th>
                  <th className="text-left p-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No emails in this range.</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className={`p-3 font-medium ${statusColor(r.status)}`}>{r.status}</td>
                    <td className="p-3">{r.template_name}</td>
                    <td className="p-3">{r.recipient_email}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={r.message_id ?? ""}>{r.message_id ?? "—"}</td>
                    <td className="p-3 text-red-400 text-xs max-w-[260px] truncate" title={r.error_message ?? ""}>{r.error_message ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Showing latest status per email (deduplicated by message ID). Limited to most recent 1,000 raw events.
        </p>
      </div>
    </div>
  );
};

export default AdminEmails;
