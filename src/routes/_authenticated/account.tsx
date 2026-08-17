import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Store, ClipboardList, Settings, CreditCard, PlusCircle, TrendingUp, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/cart";
export const Route = createFileRoute("/_authenticated/account")({ component: AccountHome });
function AccountHome() {
  const { user } = Route.useRouteContext({ from: "/_authenticated" });
  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
  const initial = name.charAt(0).toUpperCase();
  const { data: vendor } = useQuery({
    queryKey: ["my-vendor", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });
  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, total_kes, created_at, status").order("created_at", { ascending: false }).limit(3);
      return data || [];
    },
  });
  const { data: stats } = useQuery({
    queryKey: ["vendor-stats", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data: products } = await supabase.from("products").select("id").eq("vendor_id", vendor!.id);
      const { data: orderItems } = await supabase.from("order_items").select("quantity, unit_price_kes, status").eq("vendor_id", vendor!.id);
      const revenue = (orderItems || []).reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
      const pending = (orderItems || []).filter(i => i.status === "pending").length;
      return { revenue, pending, listings: (products || []).length };
    },
  });
  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  if (vendor) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl hero-surface p-8 shadow-soft">
          <div className="flex items-center gap-5">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-foreground/20 text-2xl font-bold text-primary-foreground">{initial}</div>
            <div>
              <p className="text-sm opacity-90">Seller dashboard</p>
              <h1 className="font-display text-3xl font-bold md:text-4xl">Welcome, {name}</h1>
              <p className="mt-1 text-sm opacity-90"><Store className="mr-1 inline size-4" />{vendor.shop_name} · {vendor.market_name}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <StatCard icon={Package} label="Active listings" value={stats?.listings || 0} />
          <StatCard icon={TrendingUp} label="Total revenue" value={formatKes(stats?.revenue || 0)} />
          <StatCard icon={Bell} label="Pending orders" value={stats?.pending || 0} />
          <StatCard icon={CreditCard} label="Plan" value={vendor.plan === "starter" ? "Starter" : "Biashara"} />
        </div>
        <h2 className="mt-10 text-xl font-bold">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={PlusCircle} title="Add a listing" desc="List a new product from your stall" to="/vendor" />
          <ActionCard icon={ClipboardList} title="Manage orders" desc="Confirm, deliver or cancel orders" to="/vendor" />
          <ActionCard icon={Store} title="View my shop" desc="See your shop as buyers see it" to={"/shop/" + vendor.slug} />
          <ActionCard icon={CreditCard} title="Subscription" desc="Upgrade to Biashara plan" to="/vendor" />
        </div>
        <div className="mt-10 border-t border-border pt-6"><Button variant="outline" size="sm" onClick={signOut}><LogOut className="size-4" />Sign out</Button></div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl hero-surface p-8 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-foreground/20 text-2xl font-bold text-primary-foreground">{initial}</div>
          <div>
            <p className="text-sm opacity-90">Buyer account</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Welcome, {name}</h1>
            <p className="mt-1 text-sm opacity-90">{user.email}</p>
          </div>
        </div>
      </div>
      <h2 className="mt-10 text-xl font-bold">Quick actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={ShoppingBag} title="Browse goods" desc="Shop from 47 county markets" to="/browse" />
        <ActionCard icon={ClipboardList} title="My orders" desc="Track your purchases" to="/orders" />
        <ActionCard icon={Store} title="Open a shop" desc="Sell your own goods on Soko47" to="/vendor" />
        <ActionCard icon={Settings} title="Account settings" desc="Email, password and profile" to="/account" />
      </div>
      {orders && orders.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <div>
                  <p className="font-semibold">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-KE")} · <span className="capitalize">{o.status}</span></p>
                </div>
                <p className="font-display text-lg font-bold">{formatKes(Number(o.total_kes))}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-10 border-t border-border pt-6"><Button variant="outline" size="sm" onClick={signOut}><LogOut className="size-4" />Sign out</Button></div>
    </div>
  );
}
function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <Icon className="size-5 text-accent-deep" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
function ActionCard({ icon: Icon, title, desc, to }: { icon: any; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}