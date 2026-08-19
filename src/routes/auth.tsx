import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/auth")({ component: AuthPage });
function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.2s.1-1.5.4-2.2V6.9H1.4C.5 8.6 0 10.4 0 12.2s.5 3.7 1.4 5.3l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.9l4 3.1c.9-2.8 3.5-5.2 6.6-5.2z" />
    </svg>
  );
}
function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "confirm" | "otp" | "reset">("signin");
  const [code, setCode] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !window.location.hash.includes("type=recovery")) navigate({ to: "/" });
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const saveNewPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 6) return toast.error("Password must be 6+ characters");
    if (pw1 !== pw2) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) return toast.error(error.message);
    toast.success("Password changed - you are in!");
    navigate({ to: "/" });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() || "Trader" } } });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (data.session) { toast.success("Account created - welcome to Soko47!"); navigate({ to: "/" }); }
      else setMode("confirm");
    }
  };
  const sendOtp = async () => {
    if (!email.includes("@")) return toast.error("Enter your email first");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("6-digit code sent to your email");
    setMode("otp");
  };
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Verified - welcome to Soko47!");
    navigate({ to: "/" });
  };
  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth" } });
    if (error) toast.error(error.message);
  };
  const reset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    toast.success(error ? error.message : "Reset link sent - check your email");
  };
  if (mode === "reset") return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={saveNewPw} className="rounded-3xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">You are securely verified - set your new password below.</p>
        <div className="mt-5 space-y-4">
          <div><Label>New password</Label><Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} /></div>
          <div><Label>Repeat new password</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button type="submit" size="lg" className="w-full">Save new password</Button>
        </div>
      </form>
    </div>
  );
  if (mode === "otp") return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={verifyOtp} className="rounded-3xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-7" /></span>
        <h1 className="mt-4 font-display text-2xl font-bold">Enter your code</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit one-time code to <span className="font-semibold text-foreground">{email}</span>.</p>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="••••••" className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-display text-2xl tracking-[0.5em] outline-none focus:border-primary" />
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy || code.length !== 6}>Verify & sign in</Button>
        <button type="button" className="mt-3 text-sm text-muted-foreground underline hover:text-foreground" onClick={sendOtp}>Resend code</button>
        <button type="button" className="mt-2 block w-full text-sm text-accent-deep underline" onClick={() => setMode("signin")}>Back to sign in</button>
      </form>
    </div>
  );
  if (mode === "confirm") return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><MailCheck className="size-7" /></span>
        <h1 className="mt-4 font-display text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Click it to activate your account, then come back and sign in.</p>
        <div className="mt-6 grid gap-2">
          <a href="https://mail.google.com" target="_blank" rel="noreferrer"><Button className="w-full" size="lg">Open Gmail</Button></a>
          <Button variant="outline" size="lg" onClick={() => setMode("signin")}>I have confirmed - sign in</Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Nothing after 2 minutes? Check the Spam folder.</p>
      </div>
    </div>
  );
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Join Soko47"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">One account to shop markets or run your own shop.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div><Label htmlFor="n">Full name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stephen Njora" /></div>
          )}
          <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        <Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy}><ShieldCheck className="size-4" /> Email me a one-time code (OTP)</Button>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="w-full" onClick={google}><GoogleIcon /> Continue with Google</Button>
        <div className="mt-4 space-y-2 text-center text-sm">
          {mode === "signin" && (<button className="block w-full text-muted-foreground underline hover:text-foreground" onClick={reset}>Forgot password? Reset by email</button>)}
          <button className="block w-full font-medium text-accent-deep underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
          <Link to="/" className="block text-muted-foreground hover:text-foreground">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
