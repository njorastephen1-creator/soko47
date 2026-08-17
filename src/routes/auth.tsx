import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/auth")({ component: AuthPage });
type Mode = "signin" | "signup" | "forgot";
function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [recovery, setRecovery] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session && !recovery) navigate({ to: "/account", replace: true });
  }, [session, recovery, navigate]);
  const googleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" }
    });
    if (error) return toast.error(error.message);
  };
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/account", replace: true });
  };
  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } }
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Sign in now.");
    setMode("signin");
  };
  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: window.location.origin + "/auth" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reset link sent - check your email inbox");
    setMode("signin");
  };
  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated - karibu back!");
    setRecovery(false);
    navigate({ to: "/account", replace: true });
  };
  const googleBlock = (
    <>
      <div className="relative my-4">
        <div className="border-t border-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={googleSignIn}><GoogleIcon /> Continue with Google</Button>
    </>
  );
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
        {recovery ? (
          <>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><KeyRound className="size-7 text-accent-deep" /> Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you have not used before.</p>
            <form onSubmit={saveNewPassword} className="mt-6 space-y-4">
              <div><Label htmlFor="np">New password</Label><Input id="np" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label htmlFor="cp">Confirm new password</Label><Input id="cp" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving..." : "Update password"}</Button>
            </form>
          </>
        ) : mode === "forgot" ? (
          <>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MailCheck className="size-7 text-accent-deep" /> Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and we will send you a secure reset link.</p>
            <form onSubmit={sendReset} className="mt-6 space-y-4">
              <div><Label htmlFor="em">Email</Label><Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</Button>
            </form>
            <button className="mt-5 w-full text-sm text-muted-foreground underline" onClick={() => setMode("signin")}>Back to sign in</button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">{mode === "signin" ? "Welcome back" : "Join Soko47"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">One account to shop markets or run your own shop.</p>
            <form onSubmit={mode === "signin" ? signIn : signUp} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <div><Label htmlFor="fullName">Full name</Label><Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
                  <div><Label htmlFor="phone">Phone (07xxxxxxxx)</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </>
              )}
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</Button>
            </form>
            {googleBlock}
            {mode === "signin" && (
              <button className="mt-3 w-full text-sm text-muted-foreground underline" onClick={() => setMode("forgot")}>Forgot password? Reset by email</button>
            )}
            <button className="mt-3 w-full text-sm text-muted-foreground underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
            <div className="mt-6 text-center text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">Back to home</Link></div>
          </>
        )}
      </div>
    </div>
  );
}