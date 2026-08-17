import fs from 'fs';
import path from 'path';
const files = {
'src/routes/_authenticated/route.tsx': `import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});`,

'src/routes/auth.tsx': `import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/auth")({ component: AuthPage });
function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();
  useEffect(() => { if (session) navigate({ to: "/account", replace: true }); }, [session, navigate]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, phone: form.phone } }
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm, then sign in");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Karibu back!");
      navigate({ to: "/account", replace: true });
    }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
        <h1 className="font-display text-3xl font-bold">{mode === "signin" ? "Karibu back" : "Join Soko47"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">One account to shop markets or run your own shop.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <div><Label htmlFor="fullName">Full name</Label><Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div><Label htmlFor="phone">Phone (07xxxxxxxx)</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </>
          )}
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-5 w-full text-sm text-muted-foreground underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Back to home</Link>
        </div>
      </div>
    </div>
  );
}`,

'src/routes/account.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Store, ClipboardList, Settings, CreditCard, PlusCircle, TrendingUp, MapPin, LogOut, Bell, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/cart";
export const Route = createFileRoute("/account")({ component: AccountHome });
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
  const { data: vendorStats } = useQuery({
    queryKey: ["vendor-stats", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data: products } = await supabase.from("products").select("id, title, price_kes, stock, is_active").eq("vendor_id", vendor!.id);
      const { data: orderItems } = await supabase.from("order_items").select("quantity, unit_price_kes, status").eq("vendor_id", vendor!.id);
      const revenue = (orderItems || []).reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
      const pending = (orderItems || []).filter(i => i.status === "pending").length;
      return { products: products || [], revenue, pending, listings: (products || []).length };
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
              <h1 className="font-display text-3xl font-bold md:text-4xl">Karibu, {name}</h1>
              <p className="mt-1 text-sm opacity-90"><Store className="mr-1 inline size-4" />{vendor.shop_name} · {vendor.market_name}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <StatCard icon={Package} label="Active listings" value={vendorStats?.listings || 0} />
          <StatCard icon={TrendingUp} label="Total revenue" value={formatKes(vendorStats?.revenue || 0)} />
          <StatCard icon={Bell} label="Pending orders" value={vendorStats?.pending || 0} />
          <StatCard icon={CreditCard} label="Plan" value={vendor.plan === "starter" ? "Starter" : "Biashara"} />
        </div>
        <h2 className="mt-10 text-xl font-bold">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={PlusCircle} title="Add a listing" desc="List a new product from your stall" to="/vendor" />
          <ActionCard icon={ClipboardList} title="Manage orders" desc="Confirm, deliver or cancel orders" to="/vendor" />
          <ActionCard icon={Store} title="View my shop" desc="See your shop as buyers see it" to={"/shop/" + vendor.slug} />
          <ActionCard icon={CreditCard} title="Subscription" desc="Upgrade to Biashara plan" to="/vendor" />
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="size-4" />Sign out</Button>
        </div>
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
            <h1 className="font-display text-3xl font-bold md:text-4xl">Karibu, {name}</h1>
            <p className="mt-1 text-sm opacity-90">{user.email}</p>
          </div>
        </div>
      </div>
      <h2 className="mt-10 text-xl font-bold">Quick actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={ShoppingBag} title="Browse goods" desc="Shop from 47 county markets" to="/browse" />
        <ActionCard icon={ClipboardList} title="My orders" desc="Track your purchases" to="/orders" />
        <ActionCard icon={Store} title="Open a shop" desc="Sell your own goods on Soko47" to="/sell" />
        <ActionCard icon={Settings} title="Account settings" desc="Email, password and profile" to="/account/settings" />
      </div>
      {orders && orders.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {orders.map(o => (
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
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <Button variant="outline" size="sm" onClick={signOut}><LogOut className="size-4" />Sign out</Button>
      </div>
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
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}`,

'src/routes/_authenticated/orders.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { ClipboardList, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/orders")({ component: Orders });
function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(id, title, quantity, unit_price_kes)").order("created_at", { ascending: false });
      return data || [];
    },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><ClipboardList className="size-7" />My orders</h1>
      {isLoading ? <p className="mt-6 text-muted-foreground">Loading...</p> : orders && orders.length > 0 ? (
        <div className="mt-6 space-y-4">{orders.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">Order #{o.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-KE")} · {o.delivery_location}</p>
              </div>
              <span className="warm-surface rounded-full px-3 py-1 text-xs font-medium capitalize">{o.status}</span>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              {o.order_items.map((i: any) => (
                <li key={i.id} className="flex justify-between"><span>{i.title} × {i.quantity}</span><span>{formatKes(Number(i.unit_price_kes) * i.quantity)}</span></li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-right font-semibold">{formatKes(Number(o.total_kes))}</p>
          </div>
        ))}</div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No orders yet.</p>
          <Button asChild className="mt-4"><Link to="/browse">Start shopping</Link></Button>
        </div>
      )}
    </div>
  );
}`,

'src/components/site-chrome.tsx': `import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingBasket, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const links = [
  { to: "/browse", label: "Shop goods" },
  { to: "/markets", label: "47 County markets" },
  { to: "/sell", label: "Sell with us" }
];
export function SiteHeader() {
  const { count } = useCart();
  const { session } = useSession();
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="warm-surface flex size-9 items-center justify-center rounded-xl"><Store className="size-5" /></span>
          <span className="font-display text-lg font-bold tracking-tight">Soko47</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="relative">
            <Link to="/cart"><ShoppingBasket className="size-5" />{count > 0 && <span className="warm-surface absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[11px] font-bold">{count}</span>}</Link>
          </Button>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm">My account</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account">Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/vendor">Vendor dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden"><Button variant="ghost" size="sm"><Menu className="size-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {links.map((l) => (<DropdownMenuItem key={l.to} asChild><Link to={l.to}>{l.label}</Link></DropdownMenuItem>))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">Soko47</p>
          <p className="mt-2 text-sm text-muted-foreground">One marketplace linking traders from the biggest market in every Kenyan county to buyers everywhere.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Buyers</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li><Link to="/browse">Browse goods</Link></li>
            <li><Link to="/markets">County market directory</Link></li>
            <li><Link to="/orders">Track my orders</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Traders</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li><Link to="/sell">Open a shop</Link></li>
            <li><Link to="/vendor">Vendor dashboard</Link></li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">Soko47 - built for Kenya's market traders.</p>
    </footer>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: Amazon-style dashboard applied');