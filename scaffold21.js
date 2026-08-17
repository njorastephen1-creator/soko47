import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const footerIdx = chrome.indexOf('const footerCols =');
const footerCode = footerIdx > -1 ? chrome.slice(footerIdx) : null;
if (!footerCode) { console.log('ERROR: footer not found - aborting'); process.exit(1); }
const header = `import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, ChevronDown, MapPin, Menu, Search, ShoppingBasket, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const firstName = (session?.user_metadata?.full_name || "").split(" ")[0];
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };
  return (
    <header className="sticky top-0 z-50 bg-primary-dark text-primary-foreground shadow-soft">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-primary">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground text-primary"><Store className="size-5" /></span>
          <span className="leading-none">
            <span className="block font-display text-xl font-extrabold tracking-tight">Soko47</span>
            <svg viewBox="0 0 60 8" className="mt-0.5 h-1.5 w-14 text-accent" fill="none" aria-hidden="true"><path d="M2 2c18 6 38 6 56 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </span>
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
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md px-2 py-1 text-left hover:bg-primary">
                <span className="block text-[10px] opacity-80">Hello, {firstName || "trader"}</span>
                <span className="block text-sm font-semibold">Account & Lists <ChevronDown className="inline size-3" /></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account">Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/vendor">Vendor dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/orders">My orders</Link></DropdownMenuItem>
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
  );
}
`;
fs.writeFileSync('src/components/site-chrome.tsx', header + footerCode);
console.log('Created site-chrome.tsx (new header + existing footer)');
console.log('DONE: amazon-grade header');