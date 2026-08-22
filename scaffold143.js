import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('canDeleteOrder') ) {
  v = v.split('  if (!vendor) return (').join(`  const isAdmin = session && session.user.email === "njorastephen1@gmail.com";
  const canDeleteOrder = (g: any) => isAdmin || ((Date.now() - new Date(g.created_at).getTime()) >= 20 * 864e5);
  const daysLeftOrder = (g: any) => Math.ceil(20 - (Date.now() - new Date(g.created_at).getTime()) / 864e5);
  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently? (Admin or 20+ days only)")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order deleted");
  };
  if (!vendor) return (`);
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('FIXED: vendor delete helpers defined');
} else console.log('helpers already present');