import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ChevronDown, Home, MapPin, Menu, Search, ShoppingBasket, ShoppingCart, Store, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "@/components/notifications-bell";
export function SiteHeader() {
  const { count } = useCart();
  const { session } = useSession();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("");
  const [county, setCounty] = useState(() => localStorage.getItem("soko47_county") || "nairobi");
  const countyInfo = COUNTIES.find((c) => c.slug === county);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/browse", search: { q: term || undefined, category: cat || undefined } });
  };
  const pickCounty = (slug: string) => {
    setCounty(slug);
    localStorage.setItem("soko47_county", slug);
  };
  const fullName = (session?.user_metadata?.full_name as string) || (session?.user?.email || "").split("@")[0] || "trader";
  const { data: myVendor } = useQuery({
    queryKey: ["my-vendor", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const role = myVendor ? "Trader" : "Buyer";
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };
  return (
    <>
    <header className="sticky top-0 z-50 bg-primary-dark text-primary-foreground shadow-soft">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-primary">
          <span className="flex h-12 items-center justify-center rounded-xl bg-card px-3"><img src="/logo.png" alt="Soko47" className="h-10 w-auto" /></span>
          
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-left hover:bg-primary lg:flex">
            <MapPin className="size-4 text-accent" />
            <span className="leading-tight">
              <span className="block text-[10px] opacity-80">Deliver to</span>
              <span className="block text-sm font-semibold">{countyInfo ? countyInfo.county : "Kenya"}</span>
            </span>
            <ChevronDown className="size-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            {COUNTIES.map((c) => (<DropdownMenuItem key={c.slug} onClick={() => pickCounty(c.slug)}>{c.county}</DropdownMenuItem>))}
          </DropdownMenuContent>
        </DropdownMenu>
        <form onSubmit={submit} className="order-last flex w-full min-w-0 flex-1 overflow-hidden rounded-lg bg-card md:order-none md:w-auto">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="hidden max-w-40 border-r border-border bg-secondary px-2 text-xs text-foreground sm:block">
            <option value="">All</option>
            {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
          </select>
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search sufuria, sofa, tomatoes, phones..." className="min-w-0 flex-1 bg-card px-3 py-2 text-sm text-foreground outline-none" />
          <button type="submit" aria-label="Search" className="warm-surface px-4"><Search className="size-4" /></button>
        </form>
        <div className="ml-auto flex items-center gap-1">
          <NotificationsBell />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md px-2 py-1 text-left hover:bg-primary">
                <span className="block text-[10px] opacity-80">Hello, {fullName}</span>
                <span className="block text-sm font-semibold">{role} · Account & Lists <ChevronDown className="inline size-3" /></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account">Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/vendor">Vendor dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/help">Help & support</Link></DropdownMenuItem>
                {isAdminEmail(session?.user?.email) && (<DropdownMenuItem asChild><Link to="/admin">Admin panel</Link></DropdownMenuItem>)}
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="rounded-md px-2 py-1 hover:bg-primary">
              <span className="block text-[10px] opacity-80">Hello, sign in</span>
              <span className="block text-sm font-semibold">Account & Lists</span>
            </Link>
          )}
          <Link to="/orders" className="hidden rounded-md px-2 py-1 hover:bg-primary sm:block">
            <span className="block text-[10px] opacity-80">Returns</span>
            <span className="block text-sm font-semibold">& Orders</span>
          </Link>
          <Link to="/cart" className="relative flex items-end gap-1 rounded-md px-2 py-1 hover:bg-primary">
            <ShoppingBasket className="size-6" />
            <span className="warm-surface absolute top-0 left-6 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">{count}</span>
            <span className="hidden text-sm font-semibold sm:block">Cart</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden"><Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary"><Menu className="size-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link to="/browse">Shop goods</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/markets">47 County markets</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/sell">Sell with us</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <nav className="border-t border-primary-foreground/10 bg-primary">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 text-sm">
          <Link to="/browse" className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">All goods</Link>
          <Link to="/markets" className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">47 County markets</Link>
          <Link to="/sell" className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">Sell with us</Link>
          <Link to="/browse" search={{ category: "fresh-produce" }} className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">Fresh Produce</Link>
          <Link to="/browse" search={{ category: "fashion" }} className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">Fashion</Link>
          <Link to="/browse" search={{ category: "electronics" }} className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">Electronics</Link>
          <Link to="/browse" search={{ category: "hardware" }} className="whitespace-nowrap rounded-md px-2.5 py-1 hover:bg-primary-dark">Hardware</Link>
          <Link to="/vendor" className="whitespace-nowrap rounded-md px-2.5 py-1 font-semibold text-accent hover:bg-primary-dark">Open a shop</Link>
        </div>
      </nav>
    </header>
    <MobileNav />
    </>
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
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card md:hidden">
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
const footerCols = [
  { h: "Buyers", items: [{ t: "Browse goods", to: "/browse" }, { t: "County market directory", to: "/markets" }, { t: "Track my orders", to: "/orders" }, { t: "My basket", to: "/cart" }] },
  { h: "Make money with us", items: [{ t: "Open a shop", to: "/sell" }, { t: "Vendor dashboard", to: "/vendor" }, { t: "Business suite", to: "/vendor" }, { t: "Plans & pricing", to: "/sell" }] },
  { h: "Let us help you", items: [{ t: "Help & support", to: "/help" }, { t: "Sign in / reset password", to: "/auth" }, { t: "WhatsApp us", href: "https://wa.me/254111651116" }] },
  { h: "Biggest markets", items: [{ t: "Nairobi", to: "/markets/nairobi" }, { t: "Mombasa", to: "/markets/mombasa" }, { t: "Kisumu", to: "/markets/kisumu" }, { t: "Nakuru", to: "/markets/nakuru" }, { t: "Uasin Gishu", to: "/markets/uasin-gishu" }] }
];
export function SiteFooter() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex w-full items-center justify-center gap-2 bg-background/10 py-3 text-sm font-medium hover:bg-background/20">
        <ArrowUp className="size-4" /> Back to top
      </button>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {footerCols.map((c) => (
          <div key={c.h}>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">{c.h}</p>
            <ul className="mt-4 space-y-2 text-sm opacity-85">
              {c.items.map((i) => (
                <li key={i.t}>
                  {i.to ? <Link className="transition-colors hover:text-accent hover:underline" to={i.to}>{i.t}</Link> : <a className="transition-colors hover:text-accent hover:underline" href={i.href} target="_blank" rel="noreferrer">{i.t}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 items-center justify-center rounded-lg bg-card px-2"><img src="/logo.png" alt="Soko47" className="h-6 w-auto" /></span>
            <span className="font-display font-bold">Soko47</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-md border border-background/20 px-3 py-1.5">KES · Kenyan Shilling</span>
            <span className="rounded-md border border-background/20 px-3 py-1.5">English · Swahili</span>
          </div>
        </div>
        <p className="pb-6 text-center text-xs opacity-60">© 2026 Soko47 — built for Kenya's market traders.</p>
      </div>
    </footer>
  );
}