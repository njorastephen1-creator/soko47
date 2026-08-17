import fs from 'fs';
import path from 'path';
const files = {
'src/lib/admin.ts': `export const ADMIN_EMAIL = "njorastephen1@gmail.com";
export const isAdminEmail = (email?: string | null) => email === ADMIN_EMAIL;`,

'src/components/business-tab.tsx': `import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, Download, ShoppingBag, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export function BusinessTab({ vendorId }: { vendorId: string }) {
  const { data } = useQuery({
    queryKey: ["business", vendorId],
    queryFn: async () => {
      const { data: items } = await supabase.from("order_items").select("title, quantity, unit_price_kes, status, created_at").eq("vendor_id", vendorId).order("created_at", { ascending: false });
      const { data: products } = await supabase.from("products").select("title, stock, is_active").eq("vendor_id", vendorId);
      return { items: items || [], products: products || [] };
    },
  });
  const items = data?.items || [];
  const products = data?.products || [];
  const delivered = items.filter(i => i.status === "delivered");
  const revenue = delivered.reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const pending = items.filter(i => i.status === "pending").length;
  const today = new Date().toDateString();
  const todayRevenue = delivered.filter(i => new Date(i.created_at).toDateString() === today).reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const lowStock = products.filter(p => p.is_active && p.stock <= 5);
  const exportCsv = () => {
    const rows = [["Date", "Item", "Qty", "Unit price", "Total", "Status"]];
    items.forEach(i => rows.push([new Date(i.created_at).toLocaleString(), i.title, String(i.quantity), String(i.unit_price_kes), String(Number(i.unit_price_kes) * i.quantity), i.status]));
    const csv = rows.map(r => r.map(c => '"' + c.split('"').join('""') + '"').join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "soko47-sales-record.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Business records — zero paperwork</h2>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4" /> Download sales record (CSV)</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat icon={TrendingUp} label="Total revenue (delivered)" value={formatKes(revenue)} />
        <Stat icon={CalendarDays} label="Today's sales" value={formatKes(todayRevenue)} />
        <Stat icon={ShoppingBag} label="Pending orders" value={pending} />
        <Stat icon={ShoppingBag} label="Units sold" value={delivered.reduce((s, i) => s + i.quantity, 0)} />
      </div>
      {lowStock.length > 0 && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-warning" /> Low stock alert</p>
          <p className="mt-1 text-sm text-muted-foreground">{lowStock.map(p => p.title + " (" + p.stock + " left)").join(", ")}</p>
        </div>
      )}
      <h3 className="mt-8 font-semibold">Sales ledger</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No sales yet. Your digital ledger will fill up automatically as orders come in.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((i, idx) => (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{i.title} × {i.quantity}</p>
                <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatKes(Number(i.unit_price_kes) * i.quantity)}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{i.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Icon className="size-4 text-accent-deep" />
      <p className="mt-2 text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}`,

'src/routes/_authenticated/admin.tsx': `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Package, ShieldAlert, Store, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPanel });
function AdminPanel() {
  const { user } = Route.useRouteContext({ from: "/_authenticated" });
  const qc = useQueryClient();
  const { data: vendors } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => { const { data } = await supabase.from("vendors").select("id, shop_name, market_name, county_slug, plan, subscription_status"); return data || []; },
  });
  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => { const { data } = await supabase.from("products").select("id, title, is_active").order("created_at", { ascending: false }); return data || []; },
  });
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => { const { data } = await supabase.from("orders").select("id, buyer_name, total_kes, status, created_at").order("created_at", { ascending: false }).limit(20); return data || []; },
  });
  if (user.email !== ADMIN_EMAIL)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-3 text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This account is not authorized to view the admin panel.</p>
      </div>
    );
  const revenue = (orders || []).reduce((s, o) => s + Number(o.total_kes), 0);
  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !active }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(active ? "Listing hidden from marketplace" : "Listing restored");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><ShieldAlert className="size-7 text-accent-deep" /> Admin panel</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Card icon={Store} label="Registered vendors" value={(vendors || []).length} />
        <Card icon={Package} label="Listings" value={(products || []).length} />
        <Card icon={ClipboardList} label="Orders (recent)" value={(orders || []).length} />
        <Card icon={TrendingUp} label="Order value" value={formatKes(revenue)} />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold">Moderate listings</h2>
          <div className="mt-3 space-y-2">
            {(products || []).slice(0, 10).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <p className="font-medium">{p.title}</p>
                <Button variant={p.is_active ? "ghost" : "outline"} size="sm" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? "Hide" : "Show"}</Button>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Vendors</h2>
          <div className="mt-3 space-y-2">
            {(vendors || []).map((v: any) => (
              <div key={v.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <p className="font-medium">{v.shop_name}</p>
                <p className="text-xs text-muted-foreground">{v.market_name} · {v.county_slug} · {v.plan} · {v.subscription_status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <h2 className="mt-10 text-xl font-semibold">Recent orders</h2>
      <div className="mt-3 space-y-2">
        {(orders || []).map((o: any) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{o.buyer_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · <span className="capitalize">{o.status}</span></p>
            </div>
            <p className="font-semibold">{formatKes(Number(o.total_kes))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
function Card({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <Icon className="size-5 text-accent-deep" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}`,

'src/routes/_authenticated/vendor.tsx': null,
'src/components/site-chrome.tsx': null
};
delete files['src/routes/_authenticated/vendor.tsx'];
delete files['src/components/site-chrome.tsx'];
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (vendor.includes('import { ImageUpload }')) {
  vendor = vendor.replace('import { ImageUpload } from "@/components/image-upload";', 'import { ImageUpload } from "@/components/image-upload";\nimport { BusinessTab } from "@/components/business-tab";');
  vendor = vendor.replace('<TabsTrigger value="orders">Orders</TabsTrigger>', '<TabsTrigger value="orders">Orders</TabsTrigger>\n          <TabsTrigger value="business">Business</TabsTrigger>');
  vendor = vendor.replace('<TabsContent value="orders" className="mt-6"><OrdersTab vendorId={vendor.id} /></TabsContent>', '<TabsContent value="orders" className="mt-6"><OrdersTab vendorId={vendor.id} /></TabsContent>\n        <TabsContent value="business" className="mt-6"><BusinessTab vendorId={vendor.id} /></TabsContent>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Patched vendor.tsx (Business tab)');
} else { console.log('WARNING: vendor.tsx pattern not found'); }
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('isAdminEmail')) {
  chrome = chrome.replace('import { supabase } from "@/integrations/supabase/client";', 'import { supabase } from "@/integrations/supabase/client";\nimport { isAdminEmail } from "@/lib/admin";');
  chrome = chrome.replace('<DropdownMenuItem asChild><Link to="/vendor">Vendor dashboard</Link></DropdownMenuItem>', '<DropdownMenuItem asChild><Link to="/vendor">Vendor dashboard</Link></DropdownMenuItem>\n                {isAdminEmail(session?.user?.email) && (<DropdownMenuItem asChild><Link to="/admin">Admin panel</Link></DropdownMenuItem>)}');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Patched site-chrome.tsx (Admin link)');
} else { console.log('WARNING: site-chrome pattern not found'); }
console.log('DONE: admin + business tools');