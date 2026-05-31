import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { validateInviteCode, claimInvite, consumeInvite } from "@/hooks/useInvites";

const INVITE_STORAGE_KEY = "pending_invite_code";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [invite, setInvite] = useState(params.get("invite") ?? localStorage.getItem(INVITE_STORAGE_KEY) ?? "");
  const [inviteCheck, setInviteCheck] = useState<{ valid: boolean; reason?: string; inviter?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const MIN_AGE = 16;
  const getAge = (iso: string) => {
    if (!iso) return 0;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };
  const age = getAge(dob);
  const ageOk = age >= MIN_AGE;
  const today = new Date();
  const maxDob = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate())
    .toISOString().split("T")[0];

  // Auto-validate invite code with debounce
  useEffect(() => {
    if (mode !== "signup") return;
    if (!invite || invite.length < 6) { setInviteCheck(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await validateInviteCode(invite.trim(), email || undefined);
        if (cancelled) return;
        setInviteCheck({ valid: r.valid, reason: r.reason, inviter: r.inviter_username });
        if (r.valid) localStorage.setItem(INVITE_STORAGE_KEY, invite.trim().toUpperCase());
      } catch {
        if (!cancelled) setInviteCheck({ valid: false, reason: "error" });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [invite, email, mode]);

  // After verified signin, try to consume any pending invite
  useEffect(() => {
    if (loading || !user) return;
    const code = localStorage.getItem(INVITE_STORAGE_KEY);
    (async () => {
      if (code) {
        try {
          await consumeInvite(code);
          toast.success("Invite redeemed");
        } catch (e: any) {
          if (!String(e.message).includes("already")) {
            toast.error(e.message ?? "Could not redeem invite");
          }
        } finally {
          localStorage.removeItem(INVITE_STORAGE_KEY);
        }
      }
      navigate("/", { replace: true });
    })();
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const code = invite.trim().toUpperCase();
        if (!code) throw new Error("This app is invite-only. Enter an invite code.");
        if (!dob) throw new Error("Please enter your date of birth.");
        if (!ageOk) throw new Error(`You must be at least ${MIN_AGE} years old to join.`);
        if (!ageConfirmed) throw new Error("Please confirm your age is correct.");
        const r = await validateInviteCode(code, email);
        if (!r.valid) throw new Error(`Invite ${r.reason.replace("_", " ")}`);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username || email.split("@")[0],
              invite_code: code,
              date_of_birth: dob,
              age_verified: true,
            },
          },
        });
        if (error) throw error;
        localStorage.setItem(INVITE_STORAGE_KEY, code);
        try { await claimInvite(code); } catch {}
        toast.success("Check your email to verify your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    if (mode === "signup" && !invite.trim()) {
      toast.error("This app is invite-only. Enter an invite code first.");
      return;
    }
    if (mode === "signup") {
      if (!dob) { toast.error("Please enter your date of birth."); return; }
      if (!ageOk) { toast.error(`You must be at least ${MIN_AGE} years old to join.`); return; }
      if (!ageConfirmed) { toast.error("Please confirm your age is correct."); return; }
      const r = await validateInviteCode(invite.trim());
      if (!r.valid) { toast.error(`Invite ${r.reason}`); return; }
      localStorage.setItem(INVITE_STORAGE_KEY, invite.trim().toUpperCase());
      localStorage.setItem("pending_dob", dob);
      try { await claimInvite(invite.trim()); } catch {}
    }
    const { error, redirected } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error.message ?? "OAuth failed");
    if (!redirected && !error) navigate("/", { replace: true });
  };

  const sendReset = async () => {
    if (!email) return toast.error("Enter your email above first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link");
  };

  const inviteOk = mode !== "signup" || (inviteCheck?.valid ?? false);
  const signupReady = mode !== "signup" || (inviteOk && ageOk && ageConfirmed && !!dob);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="neo-card w-full max-w-sm rounded-3xl p-7 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue" : "This app is invite-only"}
          </p>
        </div>

        {mode === "signup" && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Invite code</label>
            <input
              type="text" required placeholder="ABCD123XYZ"
              value={invite}
              onChange={(e) => setInvite(e.target.value.toUpperCase())}
              className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm font-mono tracking-wider"
            />
            {inviteCheck && (
              <p className={`text-xs flex items-center gap-1 ${inviteCheck.valid ? "text-primary" : "text-destructive"}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {inviteCheck.valid
                  ? <>Invited by @{inviteCheck.inviter ?? "a member"}</>
                  : <>Invite {inviteCheck.reason?.replace("_", " ")}</>}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button onClick={() => oauth("google")} disabled={!inviteOk} className="action-button w-full disabled:opacity-40">
            Continue with Google
          </button>
          <button onClick={() => oauth("apple")} disabled={!inviteOk} className="action-button w-full disabled:opacity-40">
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text" placeholder="Username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
            />
          )}
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
          />
          <input
            type="password" required minLength={6} placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="neo-card-inset w-full px-4 py-3 rounded-xl bg-transparent outline-none text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !inviteOk}
            className="action-button action-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>
          {mode === "signin" && (
            <button
              type="button" onClick={sendReset}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              Forgot password?
            </button>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account?" : "Already have one?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-medium"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">
          Browse as guest
        </Link>
      </div>
    </div>
  );
};

export default Auth;
