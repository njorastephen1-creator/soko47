import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let changed = false;
if (vendor.includes('import { Package } from "lucide-react";')) {
  vendor = vendor.replace('import { Package } from "lucide-react";', 'import { Package, Sparkles } from "lucide-react";');
  changed = true;
}
if (vendor.includes('Your first 30 days are free.')) {
  vendor = vendor.split('Your first 30 days are free.').join('Your first 3 weeks are free.');
  changed = true;
}
if (vendor.includes('<PlanTab plan={vendor.plan}')) {
  vendor = vendor.split('<PlanTab plan={vendor.plan} status={vendor.subscription_status} periodEnd={vendor.current_period_end} />').join('<PlanTab vendor={vendor} />');
  changed = true;
}
const idx = vendor.indexOf('function PlanTab(');
if (idx > -1) {
  vendor = vendor.slice(0, idx) + `function PlanTab({ vendor }: { vendor: any }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: rec } = useQuery({
    queryKey: ["smart-plan", vendor.id],
    queryFn: async () => {
      const { data: items } = await supabase.from("order_items").select("quantity, unit_price_kes, status").eq("vendor_id", vendor.id);
      const { data: products } = await supabase.from("products").select("id, is_active").eq("vendor_id", vendor.id);
      const all = items || [];
      const revenue = all.filter(i => i.status !== "cancelled").reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
      const listings = (products || []).filter(p => p.is_active).length;
      return recommendPlan(revenue, all.length, listings);
    },
  });
  const daysLeft = Math.ceil((new Date(vendor.current_period_end).getTime() - Date.now()) / 86400000);
  const trialing = vendor.subscription_status === "trialing";
  const accept = async (plan: string) => {
    setBusy(true);
    const { error } = await supabase.from("vendors").update({ plan: plan, subscription_status: "active", current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() }).eq("id", vendor.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Plan activated - biashara njema!");
    qc.invalidateQueries({ queryKey: ["my-vendor"] });
  };
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Your subscription</h2>
        {trialing && daysLeft > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">You are on the <span className="font-medium text-foreground">3-week free trial</span> - <span className="font-medium text-accent-deep">{daysLeft} days left</span>. No payments until it ends.</p>
        ) : trialing ? (
          <p className="mt-2 text-sm text-muted-foreground">Your free trial has ended. Pick a plan below - the system has already studied your records.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Current plan: <span className="font-medium capitalize text-foreground">{vendor.plan}</span> - active until {new Date(vendor.current_period_end).toLocaleDateString("en-KE")}</p>
        )}
      </div>
      <div className="rounded-2xl border-2 border-accent bg-card p-6">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-deep"><Sparkles className="size-4" /> Smart recommendation</p>
        {rec ? (
          <>
            <p className="mt-3 font-display text-2xl font-bold capitalize">{rec.plan} - KSh {rec.price}/month</p>
            <p className="mt-2 text-sm text-muted-foreground">{rec.why}</p>
            <p className="mt-2 text-xs text-muted-foreground">Based on your live records: {formatKes(rec.revenue)} in sales, {rec.orders} order lines, {rec.listings} active listings.</p>
            <Button className="mt-4" disabled={busy} onClick={() => accept(rec.plan)}>Accept recommendation</Button>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Analyzing your sales records...</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard name="starter" price={300} current={vendor.plan} perks={["Up to 20 listings", "Shop page with call & WhatsApp", "Orders dashboard"]} onPick={accept} busy={busy} />
        <PlanCard name="biashara" price={800} current={vendor.plan} perks={["Unlimited listings", "Featured placement in your county", "Priority support"]} onPick={accept} busy={busy} />
      </div>
    </div>
  );
}
function recommendPlan(revenue: number, orders: number, listings: number) {
  if (revenue > 100000 || listings > 40) return { plan: "biashara", price: 800, revenue, orders, listings, why: "High sales volume - Biashara's unlimited listings and featured placement will push you even further." };
  if (revenue > 20000 || orders > 15 || listings > 20) return { plan: "biashara", price: 800, revenue, orders, listings, why: "You are outgrowing Starter - Biashara removes the 20-listing cap so you never have to stop listing." };
  return { plan: "starter", price: 300, revenue, orders, listings, why: "Your current volume fits Starter perfectly - pay less while you grow." };
}
function PlanCard({ name, price, perks, current, onPick, busy }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-display text-2xl font-bold">KSh {price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
      <p className="mt-1 font-medium capitalize">{name}{current === name ? " - current" : ""}</p>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{perks.map((p: string) => (<li key={p}>{p}</li>))}</ul>
      <Button variant="outline" className="mt-4" disabled={busy} onClick={() => onPick(name)}>Choose {name}</Button>
    </div>
  );
}
`;
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor); console.log('Patched vendor.tsx (trial + smart pricing)'); } else { console.log('WARNING: vendor.tsx patterns not found'); }
let sell = fs.readFileSync('src/routes/sell.tsx', 'utf8');
let sellChanged = false;
if (sell.includes('First 30 days free for every new shop.')) { sell = sell.split('First 30 days free for every new shop.').join('First 3 weeks free for every new shop.'); sellChanged = true; }
if (sell.includes('Simple monthly plans')) { sell = sell.split('Simple monthly plans').join('Pay what fits your business'); sellChanged = true; }
if (sellChanged) { fs.writeFileSync('src/routes/sell.tsx', sell); console.log('Patched sell.tsx (3-week trial copy)'); } else { console.log('WARNING: sell.tsx patterns not found'); }
console.log('DONE: 3-week trial + smart pricing');