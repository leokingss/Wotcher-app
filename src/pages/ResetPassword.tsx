import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase delivers a recovery session via the URL hash; wait for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="neo-card w-full max-w-sm rounded-3xl p-7 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            {ready ? "Choose a strong password you haven't used before." : "Verifying your reset link…"}
          </p>
        </div>
        {ready && (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="action-button action-button-primary w-full flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
