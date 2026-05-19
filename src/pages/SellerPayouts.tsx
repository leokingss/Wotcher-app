import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ConnectStatus {
  connected: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

const SellerPayouts = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("connect-status", { body: {} });
    if (error) toast({ title: "Status check failed", description: error.message, variant: "destructive" });
    else setStatus(data as ConnectStatus);
    setLoading(false);
  };

  useEffect(() => { if (user) refresh(); }, [user?.id]);

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

  const ready = status?.connected && status.charges_enabled;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-2">Seller payouts</h1>
      <p className="text-muted-foreground mb-6">
        Connect a payout account so buyers' payments land in your bank automatically.
        Wotchers keeps 12% of each sale; you receive the rest instantly.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking status…</div>
      ) : ready ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <CheckCircle2 className="size-5 text-primary mt-0.5" />
            <div>
              <div className="font-semibold">Payouts active</div>
              <div className="text-sm text-muted-foreground">
                Your account is verified. Future sales will auto-split: you receive 88%, Wotchers retains 12%.
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={startOnboarding} disabled={starting}>
            {starting ? "Opening…" : "Update payout details"}
          </Button>
        </div>
      ) : status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <AlertCircle className="size-5 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-semibold">Onboarding incomplete</div>
              <div className="text-sm text-muted-foreground">
                Finish verification to start receiving payouts directly.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={startOnboarding} disabled={starting}>
              {starting ? "Opening…" : "Continue onboarding"}
            </Button>
            <Button variant="outline" onClick={refresh}>Refresh status</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p>You haven't set up payouts yet. Sales will be held by the platform until you connect.</p>
          <Button onClick={startOnboarding} disabled={starting}>
            {starting ? "Opening…" : "Connect payout account"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SellerPayouts;
