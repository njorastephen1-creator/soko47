import fs from 'fs';
import path from 'path';
const files = {
'src/styles.css': `@import "tailwindcss";
@import "tw-animate-css";
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-dark: var(--primary-dark);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-deep: var(--accent-deep);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-display: var(--font-display);
  --font-sans: var(--font-body);
}
:root {
  --radius: 0.75rem;
  --background: #F8FAF9;
  --foreground: #17211C;
  --card: #FFFFFF;
  --card-foreground: #17211C;
  --popover: #FFFFFF;
  --popover-foreground: #17211C;
  --primary: #087443;
  --primary-foreground: #FFFFFF;
  --primary-dark: #055A35;
  --secondary: #EDF3EF;
  --secondary-foreground: #17211C;
  --muted: #EEF2F0;
  --muted-foreground: #5F6E66;
  --accent: #D4A72C;
  --accent-foreground: #17211C;
  --accent-deep: #055A35;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --success: #16A34A;
  --warning: #F59E0B;
  --error: #DC2626;
  --border: #E4EAE7;
  --input: #D8E0DC;
  --ring: #087443;
  --gradient-hero: linear-gradient(135deg, #055A35 0%, #087443 55%, #0A8A4F 100%);
  --gradient-warm: linear-gradient(120deg, #E0B33A 0%, #C1922C 100%);
  --shadow-soft: 0 8px 24px -12px rgb(8 116 67 / 0.25);
  --shadow-lift: 0 18px 40px -20px rgb(8 116 67 / 0.35);
  --font-display: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-body: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}
@layer base {
  * { border-color: var(--color-border); }
  body { background-color: var(--color-background); color: var(--color-foreground); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; color: var(--color-foreground); }
}
@utility hero-surface { background-image: var(--gradient-hero); color: var(--color-primary-foreground); }
@utility warm-surface { background-image: var(--gradient-warm); color: var(--color-accent-foreground); }
@utility shadow-soft { box-shadow: var(--shadow-soft); }
@utility shadow-lift { box-shadow: var(--shadow-lift); }`,

'src/components/product-card.tsx': `import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BadgeCheck, MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart, formatKes } from "@/lib/cart";
export type ProductRow = { id: string; vendor_id: string; title: string; description: string | null; category_slug: string; subcategory?: string | null; price_kes: number; unit: string; stock: number; image_url: string | null; vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null };
export function ProductCard({ product }: { product: ProductRow }) {
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-12" /></div>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$id" params={{ id: product.id }}><h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3></Link>
        {product.vendors && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{product.vendors.market_name}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="font-display text-lg font-bold">{formatKes(Number(product.price_kes))}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span></p>
          <Button size="sm" onClick={add} disabled={product.stock <= 0}><Plus className="size-4" />{product.stock <= 0 ? "Sold out" : "Add"}</Button>
        </div>
        {product.vendors && (
          <p className="mt-3 flex items-center gap-1 border-t border-border pt-2 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-3.5 text-accent" /> Verified seller · {product.vendors.shop_name}
          </p>
        )}
      </div>
    </div>
  );
}`,

'src/components/site-chrome.tsx': `import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Menu, ShoppingBasket, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
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
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" /></span>
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
                <DropdownMenuItem asChild><Link to="/help">Help & support</Link></DropdownMenuItem>
                {isAdminEmail(session?.user?.email) && (<DropdownMenuItem asChild><Link to="/admin">Admin panel</Link></DropdownMenuItem>)}
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
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="size-4" /></span>
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
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: theme + mega footer');