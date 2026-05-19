import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  FileCheck2,
  Lock,
} from "lucide-react";

interface ConnectStatus {
  connected: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

interface IdentityStatus {
  exists: boolean;
  status: string; // not_started | requires_input | processing | verified | canceled
  verified?: boolean;
  last_error?: string | null;
}

const SellerPayouts = () => {
  const { user } = useAuth();
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [identity, setIdentity] = useState<IdentityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [{ data: c, error: cErr }, { data: i, error: iErr }] = await Promise.all([
      supabase.functions.invoke("connect-status", { body: {} }),
      supabase.functions.invoke("identity-status", { body: {} }),
    ]);
    if (cErr) toast({ title: "Status check failed", description: cErr.message, variant: "destructive" });
    else setConnect(c as ConnectStatus);
    if (iErr) toast({ title: "Identity check failed", description: iErr.message, variant: "destructive" });
    else setIdentity(i as IdentityStatus);
    setLoading(false);
  };

  useEffect(() => { if (user) refresh(); }, [user?.id]);

  const startIdentity = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("identity-start", {
        body: { return_url: `${window.location.origin}/payouts?identity=done` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url as string;
    } catch (e) {
      toast({ title: "Couldn't start verification", description: (e as Error).message, variant: "destructive" });
      setVerifying(false);
    }
  };

  const startOnboarding = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-onboarding", {
        body: {
          return_url: `${window.location.origin}/payouts?onboarded=1`,
          refresh_url: `${window.location.origin}/payouts?refresh=1`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url as string;
    } catch (e) {
      toast({ title: "Couldn't start onboarding", description: (e as Error).message, variant: "destructive" });
      setStarting(false);
    }
  };

  const identityVerified = identity?.verified === true;
  const payoutsReady = connect?.connected && connect.charges_enabled;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-2">Seller payouts</h1>
      <p className="text-muted-foreground mb-6">
        Two quick steps to start selling: confirm your identity, then connect a bank.
        Wotchers keeps 12% of each sale; the rest lands in your account automatically.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking status…
        </div>
      ) : (
        <div className="space-y-4">
          {/* STEP 1 — Identity */}
          <StepCard
            number={1}
            title="Verify your identity"
            done={identityVerified}
            inProgress={identity?.status === "processing"}
          >
            {identityVerified ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" /> Identity verified
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 my-3">
                  <Hint icon={<FileCheck2 className="size-4" />} label="Photo ID" />
                  <Hint icon={<Camera className="size-4" />} label="Live selfie" />
                  <Hint icon={<Lock className="size-4" />} label="Encrypted" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  You'll be taken to our secure verification partner to capture a
                  government ID and a live selfie. Your documents never touch
                  Wotchers' servers — we only receive a pass/fail result.
                </p>
                {identity?.status === "processing" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Loader2 className="size-4 animate-spin" /> Stripe is reviewing your documents…
                  </div>
                )}
                {identity?.last_error && (
                  <div className="flex items-start gap-2 text-sm text-destructive mb-3">
                    <AlertCircle className="size-4 mt-0.5" />
                    <span>Last attempt: {identity.last_error.replaceAll("_", " ")}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={startIdentity} disabled={verifying}>
                    <ShieldCheck className="size-4 mr-2" />
                    {verifying ? "Opening…" : identity?.exists ? "Continue verification" : "Start verification"}
                  </Button>
                  {identity?.exists && (
                    <Button variant="outline" onClick={refresh}>Refresh</Button>
                  )}
                </div>
              </>
            )}
          </StepCard>

          {/* STEP 2 — Payout account */}
          <StepCard
            number={2}
            title="Connect payout account"
            done={!!payoutsReady}
            locked={!identityVerified}
          >
            {!identityVerified ? (
              <p className="text-sm text-muted-foreground">
                Complete identity verification to unlock this step.
              </p>
            ) : payoutsReady ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <CheckCircle2 className="size-4 text-primary" /> Payouts active — sales auto-split 88% / 12%.
                </div>
                <Button variant="outline" onClick={startOnboarding} disabled={starting}>
                  {starting ? "Opening…" : "Update payout details"}
                </Button>
              </>
            ) : connect?.connected ? (
              <>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                  <AlertCircle className="size-4 text-yellow-500 mt-0.5" />
                  Finish bank verification to start receiving payouts.
                </div>
                <div className="flex gap-2">
                  <Button onClick={startOnboarding} disabled={starting}>
                    {starting ? "Opening…" : "Continue onboarding"}
                  </Button>
                  <Button variant="outline" onClick={refresh}>Refresh</Button>
                </div>
              </>
            ) : (
              <Button onClick={startOnboarding} disabled={starting}>
                {starting ? "Opening…" : "Connect payout account"}
              </Button>
            )}
          </StepCard>
        </div>
      )}
    </div>
  );
};

const StepCard = ({
  number,
  title,
  done,
  inProgress,
  locked,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  inProgress?: boolean;
  locked?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`p-5 rounded-xl border bg-card ${locked ? "opacity-60" : ""}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold ${
        done ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}>
        {done ? <CheckCircle2 className="size-4" /> : number}
      </div>
      <div className="font-semibold">{title}</div>
      {inProgress && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {locked && <Lock className="size-4 text-muted-foreground ml-auto" />}
    </div>
    <div className="ml-10">{children}</div>
  </div>
);

const Hint = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/50">
    {icon} {label}
  </div>
);

export default SellerPayouts;
