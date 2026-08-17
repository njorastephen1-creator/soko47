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
.dark {
  --background: #101815;
  --foreground: #F2F5F3;
  --card: #17211C;
  --card-foreground: #F2F5F3;
  --popover: #1B2620;
  --popover-foreground: #F2F5F3;
  --primary: #109457;
  --primary-foreground: #FFFFFF;
  --primary-dark: #0A8A4F;
  --secondary: #22302A;
  --secondary-foreground: #E5EBE8;
  --muted: #22302A;
  --muted-foreground: #9AA8A0;
  --accent: #D4A72C;
  --accent-foreground: #17211C;
  --accent-deep: #4CC08A;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: rgb(255 255 255 / 0.08);
  --input: rgb(255 255 255 / 0.14);
  --ring: #109457;
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
export type ProductRow = { id: string; vendor_id: string; title: string; description: string | null; category_slug: string; price_kes: number; unit: string; stock: number; image_url: string | null; vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null };
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
    <footer className="mt-20 bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">Soko47</p>
          <p className="mt-2 text-sm opacity-80">One marketplace linking traders from the biggest market in every Kenyan county to buyers everywhere.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-accent">Buyers</p>
          <ul className="mt-2 space-y-1 opacity-80">
            <li><Link to="/browse">Browse goods</Link></li>
            <li><Link to="/markets">County market directory</Link></li>
            <li><Link to="/orders">Track my orders</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-accent">Traders</p>
          <ul className="mt-2 space-y-1 opacity-80">
            <li><Link to="/sell">Open a shop</Link></li>
            <li><Link to="/vendor">Vendor dashboard</Link></li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs opacity-60">Soko47 - built for Kenya's market traders.</p>
    </footer>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: design system applied');