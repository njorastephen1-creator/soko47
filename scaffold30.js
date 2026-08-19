import fs from 'fs';
fs.writeFileSync('src/routes/auth.tsx', `import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/auth")({ component: AuthPage });
function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
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
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (data.session) { toast.success("Account created - welcome to Soko47!"); navigate({ to: "/" }); }
      else setMode("confirm");
    }
  };
  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth" } });
    if (error) toast.error(error.message);
  };
  const reset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    toast.success(error ? error.message : "Reset link sent - check your email");
  };
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
          <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="w-full" onClick={google}>Continue with Google</Button>
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
`);
console.log('DONE: confirm-email screen');