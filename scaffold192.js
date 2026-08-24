import fs from 'fs';
const f = 'src/routes/_authenticated/admin.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('const [newAdmin, setNewAdmin]')) {
  const anchor = 'const isOwner = isAdminEmail(email || "");';
  if (c.includes(anchor)) {
    c = c.split(anchor).join(anchor + `
  const { data: adminRows, refetch: refetchAdmins } = useQuery({ queryKey: ["admins-list-q"], enabled: isOwner, queryFn: async () => { const { data } = await supabase.from("admins").select("email, added_by, created_at").order("created_at", { ascending: false }); return data || []; } });
  const [newAdmin, setNewAdmin] = useState("");
  const addAdmin = async () => { const e = newAdmin.trim().toLowerCase(); if (!e || !e.includes("@")) return toast.error("Enter a valid email"); const { error } = await supabase.from("admins").insert({ email: e, added_by: email }); if (error) return toast.error(error.message); setNewAdmin(""); refetchAdmins(); toast.success(e + " is now an admin"); };
  const removeAdmin = async (e: string) => { if (!window.confirm("Remove " + e + " as admin?")) return; const { error } = await supabase.from("admins").delete().eq("email", e); if (error) return toast.error(error.message); refetchAdmins(); toast.success("Removed"); };`);
    fs.writeFileSync(f, c);
    console.log('admin state inserted inside component');
  } else console.log('anchor not found');
} else console.log('already present');