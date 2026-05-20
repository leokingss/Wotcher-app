import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Link2, Copy, Share2, Trash2, CheckCircle2, Clock, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useInvites, inviteUrl, type Invite } from "@/hooks/useInvites";
import { formatRelative } from "@/lib/time";

const statusMeta: Record<Invite["status"], { label: string; tone: string; Icon: typeof Clock }> = {
  pending: { label: "Pending", tone: "text-muted-foreground", Icon: Clock },
  claimed: { label: "Started", tone: "text-primary", Icon: Clock },
  used: { label: "Joined", tone: "text-primary", Icon: CheckCircle2 },
  expired: { label: "Expired", tone: "text-muted-foreground", Icon: XCircle },
  revoked: { label: "Revoked", tone: "text-destructive", Icon: XCircle },
};

const InviteFriends = () => {
  const navigate = useNavigate();
  const { invites, allowance, usedCount, pendingCount, remaining, loading, createInvite, revokeInvite } = useInvites();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const send = async (type: "email" | "sms" | "share_link") => {
    setSubmitting(type);
    try {
      const invite = await createInvite({
        invite_type: type,
        invitee_email: type === "email" ? email : undefined,
        invitee_phone: type === "sms" ? phone : undefined,
      });
      const url = inviteUrl(invite.code);
      if (type === "share_link") {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied");
      } else if (type === "email") {
        toast.success("Invite created — copy the link to send");
        await navigator.clipboard.writeText(url);
        setEmail("");
      } else {
        toast.success("Invite created — copy the link to send");
        await navigator.clipboard.writeText(url);
        setPhone("");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create invite");
    } finally {
      setSubmitting(null);
    }
  };

  const share = async (invite: Invite) => {
    const url = inviteUrl(invite.code);
    const text = `Join me on Wotcher — use my invite: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Wotcher invite", text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="neo-button-icon p-2 mb-4">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invite Friends</h1>
        <p className="text-sm text-muted-foreground">
          You can invite up to {allowance} people. Only verified signups count.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Remaining" value={remaining} accent />
        <Stat label="Joined" value={usedCount} />
        <Stat label="Pending" value={pendingCount} />
      </div>

      <section className="neo-card rounded-3xl p-5 space-y-4 mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4" /> Invite by email</h2>
        <div className="flex gap-2">
          <input
            type="email" placeholder="friend@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="neo-card-inset flex-1 px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
          />
          <button
            disabled={!email || submitting === "email" || remaining <= 0}
            onClick={() => send("email")}
            className="action-button action-button-primary px-4 disabled:opacity-50"
          >Send</button>
        </div>
      </section>

      <section className="neo-card rounded-3xl p-5 space-y-4 mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Phone className="w-4 h-4" /> Invite by phone</h2>
        <div className="flex gap-2">
          <input
            type="tel" placeholder="+1 555 123 4567" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="neo-card-inset flex-1 px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
          />
          <button
            disabled={!phone || submitting === "sms" || remaining <= 0}
            onClick={() => send("sms")}
            className="action-button action-button-primary px-4 disabled:opacity-50"
          >Send</button>
        </div>
      </section>

      <section className="neo-card rounded-3xl p-5 space-y-3 mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" /> Shareable link</h2>
        <p className="text-xs text-muted-foreground">
          Generate a single-use link. Share it on WhatsApp, Instagram, iMessage, anywhere.
        </p>
        <button
          disabled={submitting === "share_link" || remaining <= 0}
          onClick={() => send("share_link")}
          className="action-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> Generate & copy invite link
        </button>
      </section>

      <h2 className="text-sm font-semibold mb-3 px-1">Invite history</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground px-1">Loading…</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">No invites yet.</p>
      ) : (
        <div className="space-y-2">
          {invites.map((i) => {
            const m = statusMeta[i.status];
            const Icon = m.Icon;
            const recipient = i.invitee_email ?? i.invitee_phone ?? "Shareable link";
            const canRevoke = i.status === "pending" || i.status === "claimed";
            return (
              <div key={i.id} className="neo-card rounded-2xl p-4 flex items-center gap-3">
                <div className={`shrink-0 ${m.tone}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{recipient}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.label} · {formatRelative(i.created_at)} · code <span className="font-mono">{i.code}</span>
                  </div>
                </div>
                {canRevoke && (
                  <>
                    <button onClick={() => share(i)} className="neo-button-icon p-2" aria-label="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteUrl(i.code));
                        toast.success("Link copied");
                      }}
                      className="neo-button-icon p-2" aria-label="Copy">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Revoke this invite?")) return;
                        try { await revokeInvite(i.id); toast.success("Revoked"); }
                        catch (e: any) { toast.error(e.message); }
                      }}
                      className="neo-button-icon p-2 text-destructive" aria-label="Revoke">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className={`neo-card rounded-2xl p-4 text-center ${accent ? "" : ""}`}>
    <div className={`text-2xl font-bold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
  </div>
);

export default InviteFriends;
