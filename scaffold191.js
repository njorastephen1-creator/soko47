import fs from 'fs';
const f = 'src/routes/_authenticated/admin.tsx';
let c = fs.readFileSync(f, 'utf8');

// swap import + hook
if (!c.includes('useIsAdmin')) {
  c = c.split('import { isAdminEmail } from "@/lib/admin";').join('import { isAdminEmail } from "@/lib/admin";\nimport { useIsAdmin } from "@/lib/use-is-admin";');
  c = c.split('const isAdm = isAdminEmail(session ? session.user.email : "");').join('const email = session ? session.user.email : undefined;\n  const isAdm = useIsAdmin(email);\n  const isOwner = isAdminEmail(email || "");');
}

// admins list query
if (!c.includes('"admins-list-q"')) {
  c = c.split('  const PAGE = 15;').join('  const PAGE = 15;\n  const { data: adminRows, refetch: refetchAdmins } = useQuery({ queryKey: ["admins-list-q"], enabled: isOwner, queryFn: async () => { const { data } = await supabase.from("admins").select("email, added_by, created_at").order("created_at", { ascending: false }); return data || []; } });\n  const [newAdmin, setNewAdmin] = useState("");\n  const addAdmin = async () => { const e = newAdmin.trim().toLowerCase(); if (!e || !e.includes("@")) return toast.error("Enter a valid email"); const { error } = await supabase.from("admins").insert({ email: e, added_by: email }); if (error) return toast.error(error.message); setNewAdmin(""); refetchAdmins(); toast.success(e + " is now an admin"); };\n  const removeAdmin = async (e: string) => { if (!window.confirm("Remove " + e + " as admin?")) return; const { error } = await supabase.from("admins").delete().eq("email", e); if (error) return toast.error(error.message); refetchAdmins(); toast.success("Removed"); };');
}

// gate: deny access if not owner AND not in admins table
c = c.split('  if (!session) return (<div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Admin sign-in required</h1></div>);\n  if (!isAdm) return (<div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Admins only</h1></div>);').join('  if (!session) return (<div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Admin sign-in required</h1></div>);\n  if (!isAdm && !isOwner) return (<div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Admins only</h1></div>);');

// Add the Manage admins card right after the admin title. Insert near first <h1
if (!c.includes('Manage admins')) {
  const before = c;
  // Find the admin page header
  c = c.replace(/(<h1 className="font-display text-3xl font-bold">[^<]*Admin[^<]*<\/h1>\s*<p[^>]*>[^<]*<\/p>)/, '$1\n      {isOwner ? (<div className="mt-4 rounded-2xl border border-border bg-card p-4"><h2 className="font-display text-lg font-bold">Manage admins</h2><p className="text-xs text-muted-foreground">Only you can see this. Other admins can use the dashboard but cannot add or remove admins, and your email is hidden from everyone.</p><div className="mt-3 flex gap-2"><Input placeholder="email@example.com" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} /><Button onClick={addAdmin}>Add admin</Button></div><div className="mt-3 space-y-1">{(adminRows || []).filter((a: any) => a.email !== email).map((a: any) => (<div key={a.email} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"><div><p className="font-semibold">{a.email}</p><p className="text-xs text-muted-foreground">added {new Date(a.created_at).toLocaleDateString()} by {a.added_by || "owner"}</p></div><Button size="sm" variant="outline" className="text-destructive" onClick={() => removeAdmin(a.email)}>Remove</Button></div>))}</div></div>) : null}');
  if (c === before) console.log('header not matched - printing first 1500 chars');
  else console.log('Manage admins card inserted');
}

fs.writeFileSync(f, c);
console.log('DONE: admin management with hidden super admin');