import { createFileRoute } from "@tanstack/react-router";
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
}