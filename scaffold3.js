import fs from 'fs';
import path from 'path';
const files = {
'postcss.config.js': `export default { plugins: { "@tailwindcss/postcss": {} } };`,
'vite.config.ts': `import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});`,
'src/styles.css': `@import "tailwindcss";
@import "tw-animate-css";
@theme inline {
  --radius-sm: calc(var(--radius) - 4px); --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius); --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-card: var(--card); --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary); --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary); --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent); --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive); --color-border: var(--border);
  --color-input: var(--input); --color-ring: var(--ring);
  --color-accent-deep: var(--accent-deep); --font-display: var(--font-display);
  --font-sans: var(--font-body);
}
:root {
  --radius: 0.75rem; --background: oklch(0.985 0.014 92); --foreground: oklch(0.26 0.032 155);
  --card: oklch(1 0.004 92); --card-foreground: oklch(0.26 0.032 155);
  --primary: oklch(0.36 0.068 158); --primary-foreground: oklch(0.985 0.014 92);
  --secondary: oklch(0.945 0.028 86); --secondary-foreground: oklch(0.32 0.05 155);
  --muted: oklch(0.951 0.02 88); --muted-foreground: oklch(0.52 0.03 120);
  --accent: oklch(0.7 0.16 62); --accent-foreground: oklch(0.22 0.04 60);
  --accent-deep: oklch(0.58 0.15 55); --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.9 0.026 88); --input: oklch(0.9 0.026 88); --ring: oklch(0.7 0.16 62);
  --gradient-hero: linear-gradient(135deg, oklch(0.3 0.06 158), oklch(0.42 0.08 150) 55%, oklch(0.55 0.14 60));
  --gradient-warm: linear-gradient(120deg, oklch(0.7 0.16 62), oklch(0.62 0.16 40));
  --shadow-soft: 0 8px 24px -12px oklch(0.36 0.068 158 / 0.35);
  --shadow-lift: 0 18px 40px -20px oklch(0.36 0.068 158 / 0.45);
  --font-display: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-body: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}
@layer base {
  * { border-color: var(--color-border); }
  body { background-color: var(--color-background); color: var(--color-foreground); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; }
}
@utility hero-surface { background-image: var(--gradient-hero); color: var(--color-primary-foreground); }
@utility warm-surface { background-image: var(--gradient-warm); color: var(--color-accent-foreground); }
@utility shadow-soft { box-shadow: var(--shadow-soft); }
@utility shadow-lift { box-shadow: var(--shadow-lift); }`,
'src/data/markets.ts': `import type { LucideIcon } from "lucide-react";
import { Leaf, Wheat, Beef, Fish, UtensilsCrossed, Armchair, Smartphone, Shirt, Hammer, Sparkles, Milk, Package } from "lucide-react";
export type CountyMarkets = { county: string; slug: string; general: string; maliMali: string; produce: string; produceNote: string };
export const COUNTIES: CountyMarkets[] = [
  { county: "Baringo", slug: "baringo", general: "Marigat Market", maliMali: "Kabarnet CBD Mali Mali", produce: "Marigat Market", produceNote: "Watermelons, tomatoes, goats" },
  { county: "Bomet", slug: "bomet", general: "Sotik Open-Air Market", maliMali: "Bomet Mulot Line", produce: "Sotik Market", produceNote: "Milk, vegetables, sweet potatoes" },
  { county: "Bungoma", slug: "bungoma", general: "Webuye / Chwele", maliMali: "Bungoma Municipal", produce: "Chwele Market", produceNote: "Onions, maize, poultry" },
  { county: "Busia", slug: "busia", general: "Busia Border", maliMali: "Busia Custom Stalls", produce: "Malaba / Busia", produceNote: "Cereals, fish" },
  { county: "Elgeyo-Marakwet", slug: "elgeyo-marakwet", general: "Iten Market", maliMali: "Iten Lower Stalls", produce: "Iten Market", produceNote: "Potatoes, honey" },
  { county: "Embu", slug: "embu", general: "Ishiara Market", maliMali: "Embu Caltex", produce: "Manyatta / Ishiara", produceNote: "Avocados, mangoes" },
  { county: "Garissa", slug: "garissa", general: "Garissa Livestock", maliMali: "Suq Mugdi", produce: "Garissa Suq", produceNote: "Livestock, tomatoes" },
  { county: "Homa Bay", slug: "homa-bay", general: "Homa Bay Pier", maliMali: "Homa Bay Pier Wholesale", produce: "Homa Bay Pier", produceNote: "Fish, sweet potatoes" },
  { county: "Isiolo", slug: "isiolo", general: "Isiolo Central", maliMali: "Isiolo Main", produce: "Isiolo Central", produceNote: "Livestock, onions" },
  { county: "Kajiado", slug: "kajiado", general: "Isinya / Kajiado", maliMali: "Kitengela Mali Mali", produce: "Kitengela / Ilbisil", produceNote: "Beef, greenhouse veg" },
  { county: "Kakamega", slug: "kakamega", general: "Kakamega Municipal", maliMali: "Kakamega Main Lower", produce: "Lubao Market", produceNote: "Livestock, farm produce" },
  { county: "Kericho", slug: "kericho", general: "Kericho Green Square", maliMali: "Kericho Behind Stage", produce: "Brooke / Kericho Main", produceNote: "Tea-zone veg, potatoes" },
  { county: "Kiambu", slug: "kiambu", general: "Thika Municipal", maliMali: "Thika Commercial", produce: "Wangige Market", produceNote: "Poultry, eggs" },
  { county: "Kilifi", slug: "kilifi", general: "Ganze / Mtwapa", maliMali: "Mtwapa Posta Line", produce: "Mtwapa / Charo Wa Mae", produceNote: "Coconuts, cashews" },
  { county: "Kirinyaga", slug: "kirinyaga", general: "Kianyaga / Sagana", maliMali: "Kerugoya Stadium Rd", produce: "Wang'uru (Mwea)", produceNote: "Pishori rice, tomatoes" },
  { county: "Kisii", slug: "kisii", general: "Kisii Daraja Mbili", maliMali: "Daraja Mbili Upper", produce: "Daraja Mbili", produceNote: "Bananas, sweet potatoes" },
  { county: "Kisumu", slug: "kisumu", general: "Kibuye Market", maliMali: "Kibuye Mali Mali", produce: "Kibuye Market", produceNote: "Fish, fresh food wholesale" },
  { county: "Kitui", slug: "kitui", general: "Kitui Mulango", maliMali: "Kitui Kalundu", produce: "Kalundu Market", produceNote: "Ndengu, sorghum" },
  { county: "Kwale", slug: "kwale", general: "Ukunda / Msambweni", maliMali: "Ukunda Stage", produce: "Ukunda / Kwale", produceNote: "Citrus, seafood" },
  { county: "Laikipia", slug: "laikipia", general: "Nanyuki Open-Air", maliMali: "Nanyuki Central Lower", produce: "Nanyuki Open-Air", produceNote: "Highland veg, beef" },
  { county: "Lamu", slug: "lamu", general: "Lamu Old Town", maliMali: "Mpeketoni Wholesale", produce: "Mpeketoni Market", produceNote: "Maize, cotton, cashews" },
  { county: "Machakos", slug: "machakos", general: "Machakos Kong'a", maliMali: "Machakos Industrial", produce: "Tala / Mitaboni", produceNote: "Avocados, citrus" },
  { county: "Makueni", slug: "makueni", general: "Emali Market", maliMali: "Wote Town Market", produce: "Emali / Kibwezi", produceNote: "Mangoes, watermelons" },
  { county: "Mandera", slug: "mandera", general: "Mandera Border", maliMali: "Mandera Central Suq", produce: "Mandera Central", produceNote: "Watermelons, onions" },
  { county: "Marsabit", slug: "marsabit", general: "Marsabit Central", maliMali: "Marsabit Central Square", produce: "Marsabit Town", produceNote: "Livestock, mountain crops" },
  { county: "Meru", slug: "meru", general: "Makutano / Nkubu", maliMali: "Makutano Junction", produce: "Gakoromone Market", produceNote: "Bananas, potatoes" },
  { county: "Migori", slug: "migori", general: "Migori Kehancha", maliMali: "Migori Posta Road", produce: "Kehancha Market", produceNote: "Maize, tobacco" },
  { county: "Mombasa", slug: "mombasa", general: "Kongowea Market", maliMali: "Kongowea Mali Mali", produce: "Kongowea Market", produceNote: "Coastal wholesale" },
  { county: "Murang'a", slug: "muranga", general: "Kiria-ini Market", maliMali: "Murang'a Mukuyu", produce: "Maragua Market", produceNote: "Bananas, avocados" },
  { county: "Nairobi", slug: "nairobi", general: "Gikomba Market", maliMali: "Kamukunji Market", produce: "Wakulima (Marikiti)", produceNote: "Produce and cereals" },
  { county: "Nakuru", slug: "nakuru", general: "Nakuru OTC", maliMali: "Nakuru Top Market", produce: "Wakulima Nakuru", produceNote: "Carrots, potatoes, cabbage" },
  { county: "Nandi", slug: "nandi", general: "Kapsabet Open-Air", maliMali: "Kapsabet Behind Stage", produce: "Kapsabet Open-Air", produceNote: "Dairy, vegetables" },
  { county: "Narok", slug: "narok", general: "Narok County", maliMali: "Narok Bridge-side", produce: "Mulot / Narok", produceNote: "Wheat, maize, beef" },
  { county: "Nyamira", slug: "nyamira", general: "Nyamira Town", maliMali: "Keroka wholesale", produce: "Keroka / Nyamira", produceNote: "Bananas, tea veg" },
  { county: "Nyandarua", slug: "nyandarua", general: "Ol Kalou Market", maliMali: "Ol Kalou Main Stage", produce: "Ol Kalou / Njabini", produceNote: "Potato hub" },
  { county: "Nyeri", slug: "nyeri", general: "Karatina Market", maliMali: "Karatina Upper Floor", produce: "Karatina Market", produceNote: "Fresh food market" },
  { county: "Samburu", slug: "samburu", general: "Maralal Town", maliMali: "Maralal Central", produce: "Maralal / Baragoi", produceNote: "Livestock, hides" },
  { county: "Siaya", slug: "siaya", general: "Bondo Market", maliMali: "Bondo Stage Lane", produce: "Bondo Market", produceNote: "Omena, tilapia" },
  { county: "Taita Taveta", slug: "taita-taveta", general: "Taveta Border", maliMali: "Voi Town Market", produce: "Taveta Border", produceNote: "Bananas, onions" },
  { county: "Tana River", slug: "tana-river", general: "Hola Market", maliMali: "Hola Town Center", produce: "Hola Market", produceNote: "Cotton, rice" },
  { county: "Tharaka-Nithi", slug: "tharaka-nithi", general: "Chuka Open-Air", maliMali: "Chuka Lower", produce: "Chuka Market", produceNote: "Bananas, yams" },
  { county: "Trans Nzoia", slug: "trans-nzoia", general: "Kitale Municipal", maliMali: "Kitale Line Tano", produce: "Kitale Municipal", produceNote: "Maize basket" },
  { county: "Turkana", slug: "turkana", general: "Lodwar Central", maliMali: "Lodwar Suq", produce: "Lodwar Central", produceNote: "River produce" },
  { county: "Uasin Gishu", slug: "uasin-gishu", general: "Eldoret Main", maliMali: "Eldoret Mali Mali", produce: "Eldoret Main", produceNote: "North Rift maize" },
  { county: "Vihiga", slug: "vihiga", general: "Chavakali Market", maliMali: "Chavakali Junction", produce: "Chavakali Market", produceNote: "Sweet potatoes" },
  { county: "Wajir", slug: "wajir", general: "Wajir Livestock", maliMali: "Wajir Orahey", produce: "Wajir Livestock", produceNote: "Camel milk" },
  { county: "West Pokot", slug: "west-pokot", general: "Makutano Market", maliMali: "Kapenguria Makutano", produce: "Makutano Market", produceNote: "Potatoes, cattle" }
];
export const getCounty = (slug: string) => COUNTIES.find((c) => c.slug === slug);
export type Category = { slug: string; name: string; icon: LucideIcon };
export const CATEGORIES: Category[] = [
  { slug: "vegetables", name: "Vegetables & Fruits", icon: Leaf },
  { slug: "cereals", name: "Cereals & Grains", icon: Wheat },
  { slug: "livestock", name: "Livestock & Poultry", icon: Beef },
  { slug: "fish", name: "Fish & Seafood", icon: Fish },
  { slug: "utensils", name: "Utensils & Plastics", icon: UtensilsCrossed },
  { slug: "furniture", name: "Furniture", icon: Armchair },
  { slug: "electronics", name: "Electronics", icon: Smartphone },
  { slug: "clothing", name: "Clothing & Mitumba", icon: Shirt },
  { slug: "hardware", name: "Hardware & Tools", icon: Hammer },
  { slug: "beauty", name: "Beauty & Health", icon: Sparkles },
  { slug: "dairy", name: "Dairy & Eggs", icon: Milk },
  { slug: "other", name: "Other Goods", icon: Package }
];
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? "Other Goods";`,
'src/components/ui/button.tsx': `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  { variants: { variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-secondary",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-secondary",
      link: "text-primary underline-offset-4 hover:underline" },
    size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" } },
    defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
export { Button, buttonVariants };`,
'src/components/ui/input.tsx': `import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", className)} ref={ref} {...props} />
  ));
Input.displayName = "Input";
export { Input };`,
'src/components/ui/label.tsx': `import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
  ));
Label.displayName = "Label";
export { Label };`,
'src/components/ui/textarea.tsx': `import * as React from "react";
import { cn } from "@/lib/utils";
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea className={cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", className)} ref={ref} {...props} />
  ));
Textarea.displayName = "Textarea";
export { Textarea };`,
'src/components/ui/tabs.tsx': `import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />));
const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground", className)} {...props} />));
const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-2", className)} {...props} />));
export { Tabs, TabsList, TabsTrigger, TabsContent };`,
'src/components/ui/dropdown-menu.tsx': `import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-card p-1 shadow-md", className)} {...props} />
  </DropdownMenuPrimitive.Portal>));
const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-secondary", className)} {...props} />));
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };`,
'src/components/ui/sonner.tsx': `import { Toaster as Sonner } from "sonner";
export function Toaster() { return <Sonner className="toaster group" />; }`,
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
}`,
'src/components/product-card.tsx': `import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart, formatKes } from "@/lib/cart";
export type ProductRow = { id: string; vendor_id: string; title: string; description: string | null; category_slug: string; price_kes: number; unit: string; stock: number; image_url: string | null; vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null };
export function ProductCard({ product }: { product: ProductRow }) {
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-12" /></div>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$id" params={{ id: product.id }}><h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3></Link>
        {product.vendors && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{product.vendors.shop_name} · {product.vendors.market_name}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="font-display text-lg font-bold">{formatKes(Number(product.price_kes))}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span></p>
          <Button size="sm" onClick={add} disabled={product.stock <= 0}><Plus className="size-4" />{product.stock <= 0 ? "Sold out" : "Add"}</Button>
        </div>
      </div>
    </div>
  );
}`,
'src/routes/__root.tsx': `import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1"><Outlet /></main>
      <SiteFooter />
      <Toaster />
    </div>
  ),
});`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: full design system applied');