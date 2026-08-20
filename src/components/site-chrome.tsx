import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, Home, MapPin, Menu, Search, ShoppingBasket, ShoppingCart, Store, User, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES, getCounty } from "@/data/markets";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { isAdminEmail } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
function NotificationsBell() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifs", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false }).limit(8);
      return data || [];
    },
  });
  const unread = (data || []).filter((n: any) => !n.read).length;
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", session!.user.id).eq("read", false);
    qc.invalidateQueries();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-md p-2 hover:bg-black/10">
        <Bell className="size-5" />
        {unread > 0 && <span className="warm-surface absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold">{unread}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && <button onClick={markAll} className="text-xs text-accent-deep underline">Mark all read</button>}
        </div>
        {(data || []).length === 0 && <p className="px-3 pb-3 text-xs text-muted-foreground">No notifications yet.</p>}
        {(data || []).map((n: any) => (
          <DropdownMenuItem key={n.id} asChild>
            <Link to={(n.link as string) || "/"} className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.body}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function MobileNav() {
  const { count } = useCart();
  const { session } = useSession();
  const items = [
    { to: "/", label: "Home", icon: Home, badge: 0 },
    { to: "/browse", label: "Shop", icon: Search, badge: 0 },
    { to: "/sell", label: "Sell", icon: Store, badge: 0 },
    { to: "/cart", label: "Cart", icon: ShoppingCart, badge: count },
    { to: session ? "/account" : "/auth", label: "Account", icon: User, badge: 0 }
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card md:hidden">
      {items.map((i) => (
        <Link key={i.label} to={i.to} className="relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground">
          <i.icon className="size-5" />
          {i.label}
          {i.badge > 0 && <span className="warm-surface absolute left-1/2 top-0.5 ml-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold">{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
export function SiteHeader() {
  const [sc, setSc] = useState("all");
  const [countySlug, setCountySlug] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("soko47_county") || "nairobi" : "nairobi"));
  const [open, setOpen] = useState(false);
  const { session } = useSession();
  const { count } = useCart();
  const navigate = useNavigate();
  const county = getCounty(countySlug);
  const isAdmin = isAdminEmail(session ? session.user.email : "");
  const fullName = (session && session.user_metadata ? (session.user_metadata.full_name as string) : "") || (session && session.user.email ? session.user.email.split("@")[0] : "") || "trader";
  const { data: myVendor } = useQuery({
    queryKey: ["my-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, slug").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const role = myVendor ? "Trader" : "Buyer";
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("input");
    const query = input ? input.value.trim() : "";
    navigate({ to: "/browse", search: { q: query || undefined, category: sc === "all" ? undefined : sc } });
  };
  const setCounty = (slug: string) => { setCountySlug(slug); localStorage.setItem("soko47_county", slug); };
  const signOut = async () => { await supabase.auth.signOut(); toast.success("Signed out - see you soon!"); navigate({ to: "/" }); };
  return (
    <>
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 shadow-md" aria-label="Soko47 home">
            <ShoppingBasket className="size-4 text-accent-deep" />
            <span className="font-display text-base font-black tracking-tight text-primary">soko<span className="text-accent-deep">47</span></span>
          </Link>
          <button className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-left hover:bg-black/10 md:flex" onClick={() => setOpen(true)}>
            <MapPin className="size-4 text-accent" />
            <span><span className="block text-[10px] opacity-80">Deliver to</span><span className="block text-sm font-semibold">{county ? county.county : "Kenya"}</span></span>
          </button>
          <form onSubmit={go} className="flex min-w-0 flex-1 overflow-hidden rounded-lg bg-white">
            <select value={sc} onChange={(e) => setSc(e.target.value)} className="hidden border-r border-border bg-secondary px-2 text-xs text-foreground sm:block">
              <option value="all">All</option>
              {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
            </select>
            <input defaultValue="" placeholder="Search sufuria, sofa, tomatoes, phones..." className="min-w-0 flex-1 px-3 py-2 text-sm text-foreground outline-none" />
            <button className="bg-accent px-3 sm:px-4" aria-label="Search"><Search className="size-4 text-foreground" /></button>
          </form>
          <div className="hidden shrink-0 sm:block"><NotificationsBell /></div>
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden shrink-0 rounded-md px-2 py-1 text-left hover:bg-black/10 md:block">
              <span className="block text-[10px] opacity-80">Hello, {fullName}</span>
              <span className="block text-sm font-semibold">{role} · Account & Lists <ChevronDown className="inline size-3" /></span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild><Link to="/account">My account</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
              {myVendor && <DropdownMenuItem asChild><Link to="/vendor">Shop dashboard</Link></DropdownMenuItem>}
              {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin command center</Link></DropdownMenuItem>}
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/orders" className="hidden shrink-0 rounded-md px-2 py-1 hover:bg-black/10 md:block">
            <span className="block text-[10px] opacity-80">Returns</span>
            <span className="block text-sm font-semibold">& Orders</span>
          </Link>
          <Link to="/cart" className="relative shrink-0 rounded-md p-2 hover:bg-black/10" aria-label="Cart">
            <ShoppingBasket className="size-6" />
            <span className="warm-surface absolute right-0 top-0 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">{count}</span>
          </Link>
          <button className="shrink-0 rounded-md p-2 hover:bg-black/10 md:hidden" aria-label="Menu" onClick={() => setOpen(true)}><Menu className="size-6" /></button>
        </div>
        <nav className="bg-black/10 text-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-3 py-2 sm:px-4">
            <button className="flex items-center gap-1 whitespace-nowrap font-semibold md:hidden" onClick={() => setOpen(true)}><Menu className="size-4" /> All</button>
            <Link to="/browse" className="whitespace-nowrap font-medium hover:underline">All goods</Link>
            <Link to="/markets" className="whitespace-nowrap hover:underline">47 County markets</Link>
            <Link to="/sell" className="whitespace-nowrap hover:underline">Sell with us</Link>
            <Link to="/browse" search={{ category: "fresh-produce" }} className="whitespace-nowrap hover:underline">Fresh Produce</Link>
            <Link to="/browse" search={{ category: "fashion" }} className="whitespace-nowrap hover:underline">Fashion</Link>
            <Link to="/browse" search={{ category: "electronics" }} className="whitespace-nowrap hover:underline">Electronics</Link>
            <Link to="/browse" search={{ category: "hardware" }} className="whitespace-nowrap hover:underline">Hardware</Link>
            <Link to="/sell" className="whitespace-nowrap font-semibold text-accent hover:underline">Open a shop</Link>
          </div>
        </nav>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-card p-4 text-foreground">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display font-bold"><Menu className="size-5" /> Soko47</p>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold">Hello, {fullName} · {role}</p>
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Deliver to</p>
              <select value={countySlug} onChange={(e) => setCounty(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-sm">
                {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
              </select>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shop</p>
              <Link to="/browse" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">All goods</Link>
              <Link to="/markets" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">47 County markets</Link>
              <Link to="/browse" search={{ category: "fresh-produce" }} onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Fresh Produce</Link>
              <Link to="/browse" search={{ category: "fashion" }} onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Fashion</Link>
              <Link to="/browse" search={{ category: "electronics" }} onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Electronics</Link>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">You</p>
              <Link to="/account" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">My account</Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Returns & Orders</Link>
              <Link to="/settings" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Settings</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Cart</Link>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sell</p>
              <Link to="/sell" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Open a shop</Link>
              {myVendor && <Link to="/vendor" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Shop dashboard</Link>}
              {myVendor && <Link to="/pos" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">POS & Receipts</Link>}
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Admin command center</Link>}
            </div>
            <div className="mt-5">
              {session ? <Button variant="outline" className="w-full" onClick={signOut}>Sign out</Button> : <Button className="w-full" asChild><Link to="/auth">Sign in</Link></Button>}
            </div>
          </div>
        </div>
      )}
      <MobileNav />
    </>
  );
}
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary text-primary-foreground">
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="block w-full bg-black/10 py-3 text-center text-sm font-medium hover:bg-black/20">Back to top</button>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">Soko47</p>
          <p className="mt-2 text-sm opacity-80">Kenya's great markets, now open online. Buy directly from the traders who run the stalls.</p>
        </div>
        <div>
          <p className="text-sm font-bold">Shop</p>
          <div className="mt-2 space-y-1 text-sm opacity-80">
            <Link to="/browse" className="block hover:underline">All goods</Link>
            <Link to="/markets" className="block hover:underline">47 County markets</Link>
            <Link to="/browse" search={{ category: "fresh-produce" }} className="block hover:underline">Fresh Produce</Link>
            <Link to="/browse" search={{ category: "fashion" }} className="block hover:underline">Fashion</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Sell & Account</p>
          <div className="mt-2 space-y-1 text-sm opacity-80">
            <Link to="/sell" className="block hover:underline">Open a shop</Link>
            <Link to="/account" className="block hover:underline">My account</Link>
            <Link to="/settings" className="block hover:underline">Settings</Link>
            <Link to="/orders" className="block hover:underline">Orders</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">© 2026 Soko47 · Made in Kenya</p>
    </footer>
  );
}
