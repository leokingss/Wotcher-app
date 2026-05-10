import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) { setState({ kind: "invalid" }); return; }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await r.json();
        if (r.ok && data.valid) setState({ kind: "valid" });
        else if (data?.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "invalid" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) setState({ kind: "error", message: error.message });
    else if ((data as any)?.success) setState({ kind: "success" });
    else if ((data as any)?.reason === "already_unsubscribed") setState({ kind: "already" });
    else setState({ kind: "error", message: "Unsubscribe failed" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="neo-card max-w-md w-full p-8 text-center space-y-5 rounded-3xl">
        <h1 className="text-2xl font-bold">Email preferences</h1>

        {state.kind === "loading" && <p className="text-muted-foreground">Checking your link…</p>}

        {state.kind === "valid" && (
          <>
            <p className="text-muted-foreground">
              Click below to stop receiving emails from Picture Pal at this address.
            </p>
            <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
          </>
        )}

        {state.kind === "submitting" && <p className="text-muted-foreground">Processing…</p>}

        {state.kind === "success" && (
          <p className="text-foreground">You've been unsubscribed. We won't email you again.</p>
        )}

        {state.kind === "already" && (
          <p className="text-muted-foreground">This address is already unsubscribed.</p>
        )}

        {state.kind === "invalid" && (
          <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
        )}

        {state.kind === "error" && (
          <p className="text-destructive">{state.message}</p>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
