import fs from 'fs';
let auth = fs.readFileSync('src/routes/auth.tsx', 'utf8');
let changed = false;
if (!auth.includes('"reset"')) {
  auth = auth.split('const [mode, setMode] = useState<"signin" | "signup" | "confirm" | "otp">("signin");').join('const [mode, setMode] = useState<"signin" | "signup" | "confirm" | "otp" | "reset">("signin");');
  auth = auth.split('  const [code, setCode] = useState("");').join('  const [code, setCode] = useState("");\n  const [pw1, setPw1] = useState("");\n  const [pw2, setPw2] = useState("");');
  auth = auth.split(`  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, []);`).join(`  useEffect(() => {
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
  };`);
  auth = auth.split('  if (mode === "otp") return (').join(`  if (mode === "reset") return (
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
  if (mode === "otp") return (`);
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/auth.tsx', auth); console.log('DONE: password reset screen'); }
else console.log('already present or anchor missing');