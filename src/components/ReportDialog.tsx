import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

export type ReportTargetType = "listing" | "user" | "message" | "post";

const REASONS: { value: string; label: string; severity: "low" | "normal" | "high" | "critical" }[] = [
  { value: "scam", label: "Scam", severity: "critical" },
  { value: "counterfeit", label: "Counterfeit / fake item", severity: "high" },
  { value: "prohibited", label: "Prohibited item", severity: "high" },
  { value: "harassment", label: "Harassment / abuse", severity: "high" },
  { value: "spam", label: "Spam", severity: "low" },
  { value: "fake_account", label: "Fake account", severity: "normal" },
  { value: "suspicious", label: "Suspicious behavior", severity: "normal" },
  { value: "other", label: "Other", severity: "low" },
];

const schema = z.object({
  reason: z.string().min(1, "Pick a reason"),
  details: z.string().trim().max(1000, "Keep under 1000 characters").optional(),
});

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  trigger?: React.ReactNode;
  label?: string;
}

export const ReportDialog = ({ targetType, targetId, trigger, label = "Report" }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) { toast({ title: "Please sign in to report" }); return; }
    const parsed = schema.safeParse({ reason, details });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const meta = REASONS.find((r) => r.value === reason);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
      severity: meta?.severity ?? "normal",
      status: "open",
    });
    setBusy(false);
    if (error) { toast({ title: "Could not file report", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Report submitted", description: "Our moderation team will review it." });
    setOpen(false); setReason(""); setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Flag className="w-4 h-4" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="neo-card border-0 max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" /> Report this {targetType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
            {REASONS.map((r) => (
              <Label key={r.value} className="flex items-center gap-2 neo-card-inset rounded-xl p-3 cursor-pointer">
                <RadioGroupItem value={r.value} /> <span className="text-sm">{r.label}</span>
              </Label>
            ))}
          </RadioGroup>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide">Add details (optional)</Label>
            <Textarea value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)}
              placeholder="What happened?" className="neo-card-inset border-0" rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !reason}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
