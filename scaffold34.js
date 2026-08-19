import fs from 'fs';
let auth = fs.readFileSync('src/routes/auth.tsx', 'utf8');
if (auth.includes('otp')) { console.log('OTP already present'); process.exit(0); }
auth = auth.split('const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin");').join('const [mode, setMode] = useState<"signin" | "signup" | "confirm" | "otp">("signin");\n  const [code, setCode] = useState("");');
auth = auth.split('import { MailCheck } from "lucide-react";').join('import { MailCheck, ShieldCheck } from "lucide-react";');
auth = auth.split(`  const google = async () => {`).join(`  const sendOtp = async () => {
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
  const google = async () => {`);
auth = auth.split(`        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="w-full" onClick={google}><GoogleIcon /> Continue with Google</Button>`).join(`        <Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy}><ShieldCheck className="size-4" /> Email me a one-time code (OTP)</Button>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="w-full" onClick={google}><GoogleIcon /> Continue with Google</Button>`);
auth = auth.split('  if (mode === "confirm") return (').join(`  if (mode === "otp") return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={verifyOtp} className="rounded-3xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-7" /></span>
        <h1 className="mt-4 font-display text-2xl font-bold">Enter your code</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit one-time code to <span className="font-semibold text-foreground">{email}</span>.</p>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="••••••" className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-display text-2xl tracking-[0.5em] outline-none focus:border-primary" />
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy || code.length !== 6}>Verify & sign in</Button>
        <button type="button" className="mt-3 text-sm text-muted-foreground underline hover:text-foreground" onClick={sendOtp}>Resend code</button>
        <button type="button" className="mt-2 block w-full text-sm text-accent-deep underline" onClick={() => setMode("signin")}>Back to sign in</button>
      </form>
    </div>
  );
  if (mode === "confirm") return (`);
fs.writeFileSync('src/routes/auth.tsx', auth);
console.log('DONE: OTP sign-in added');