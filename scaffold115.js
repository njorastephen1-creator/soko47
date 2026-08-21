import fs from 'fs';
fs.writeFileSync('src/lib/my-vendor.ts', `import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function useMyVendor() {
  const { session } = useSession();
  const { data: vendors } = useQuery({
    queryKey: ["my-vendors", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id);
      return data || [];
    },
  });
  const { data: prof } = useQuery({
    queryKey: ["active-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("active_vendor_id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const list = vendors || [];
  const vendor = list.find((v: any) => v.id === (prof ? prof.active_vendor_id : null)) || list[0] || null;
  return { vendor, vendors: list };
}
`);
console.log('Created useMyVendor hook');
const re = /const \{ data: vendor \} = useQuery\(\{[\s\S]*?\}\);/;
for (const f of ['src/routes/_authenticated/vendor.tsx', 'src/routes/_authenticated/pos.tsx', 'src/routes/_authenticated/pro.tsx', 'src/routes/_authenticated/profile.tsx', 'src/routes/_authenticated/chats.tsx', 'src/components/chat-fab.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  if (re.test(c)) {
    c = c.replace(re, 'const { vendor } = useMyVendor();');
    if (!c.includes('import { useMyVendor }')) c = c.split('import { useSession } from "@/lib/use-session";').join('import { useSession } from "@/lib/use-session";\nimport { useMyVendor } from "@/lib/my-vendor";');
    fs.writeFileSync(f, c);
    console.log('Hooked:', f);
  } else console.log('NO MATCH:', f);
}
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (v.includes('const { vendor } = useMyVendor();')) {
  v = v.split('const { vendor } = useMyVendor();').join('const { vendor, vendors } = useMyVendor();');
}
if (!v.includes('My shops')) {
  v = v.split('    toast.success("Product live on the market!");\n  };').join(`    toast.success("Product live on the market!");\n  };
  const [newShop, setNewShop] = useState("");
  const switchShop = async (id: string) => {
    await supabase.from("user_profiles").upsert({ user_id: session.user.id, active_vendor_id: id });
    qc.invalidateQueries();
    toast.success("Switched shop - whole dashboard follows");
  };
  const openShop = async () => {
    if (newShop.trim().length < 2) return toast.error("Name the new shop");
    const { data, error } = await supabase.from("vendors").insert({ user_id: session.user.id, shop_name: newShop.trim(), slug: newShop.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36), county_slug: vendor ? vendor.county_slug : "nairobi", market_name: vendor ? vendor.market_name : null, subscription_plan: "trial", status: "active" }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("user_profiles").upsert({ user_id: session.user.id, active_vendor_id: data.id });
    setNewShop("");
    qc.invalidateQueries();
    toast.success("New shop opened - pick its plan!");
  };`);
  v = v.split('      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">➕ Add a product</h2>').join(`      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">🏪 My shops</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(vendors || []).map((s: any) => (
            <button key={s.id} onClick={() => switchShop(s.id)} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (vendor && vendor.id === s.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>{s.shop_name} · {s.subscription_plan || "trial"}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="w-44" placeholder="New shop name" value={newShop} onChange={(e) => setNewShop(e.target.value)} />
          <Button size="sm" onClick={openShop}>+ Open another shop</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Each shop has its OWN subscription, products, chats & payments. Tap a pill to switch - the whole app follows.</p>
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">➕ Add a product</h2>`);
  v = v.split('          <div><Label>Category</Label>\n            <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" value={np.category} onChange={(e) => setNp({ ...np, category: e.target.value })}>\n              <option value="produce">Fresh Produce</option>\n              <option value="electronics">Electronics</option>\n              <option value="fashion">Fashion</option>\n              <option value="household">Household</option>\n              <option value="other">Other</option>\n            </select>\n          </div>').join('          <div className="sm:col-span-2"><Label>Category</Label>\n            <div className="mt-1 flex flex-wrap gap-2">\n              {[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["other", "Other"]].map((c: any) => (\n                <button key={c[0]} type="button" onClick={() => setNp({ ...np, category: c[0] })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.category === c[0] ? "bg-primary text-primary-foreground" : "bg-secondary")}>{c[1]}</button>\n              ))}\n            </div>\n          </div>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: shops switcher + category chips');
}
console.log('DONE');