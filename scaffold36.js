import fs from 'fs';
let css = fs.readFileSync('src/styles.css', 'utf8');
if (!css.includes('padding-bottom: 60px')) {
  css = css.split('.ad-in { animation: ad-in 0.6s ease both; }').join('.ad-in { animation: ad-in 0.6s ease both; }\n@media (max-width: 767px) { body { padding-bottom: 60px; } }');
  fs.writeFileSync('src/styles.css', css);
  console.log('Patched styles.css (mobile nav space)');
}
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('MobileNav')) {
  chrome = chrome.split('import { ArrowUp, ChevronDown, MapPin, Menu, Search, ShoppingBasket, Store } from "lucide-react";').join('import { ArrowUp, ChevronDown, Home, MapPin, Menu, Search, ShoppingBasket, ShoppingCart, Store, User } from "lucide-react";');
  chrome = chrome.split('const footerCols = [').join(`function MobileNav() {
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
const footerCols = [`);
  chrome = chrome.split('  return (\n    <header').join('  return (\n    <>\n    <header');
  chrome = chrome.split('</header>\n  );\n}').join('</header>\n    <MobileNav />\n    </>\n  );\n}');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Patched site-chrome (mobile bottom nav)');
}
const files = {};
files['src/routes/_authenticated/enrich.$id.tsx'] = `import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/enrich/$id")({ component: EnrichPage });
function EnrichPage() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: product } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors(user_id)").eq("id", id).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);
  const f = form || (product ? { condition: product.condition || "new", brand: product.brand || "", model: product.model || "", description: product.description || "", images: (product.images as string[]) || [], specs: (product.specs as any[]) || [] } : null);
  if (!product || !f) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  if (product.vendors && session && product.vendors.user_id !== session.user.id) return <p className="py-16 text-center text-muted-foreground">Only the shop owner can edit this listing.</p>;
  const save = async () => {
    const { error } = await supabase.from("products").update({ condition: f.condition, brand: f.brand.trim() || null, model: f.model.trim() || null, description: f.description, images: f.images, specs: f.specs.filter((s: any) => s.label && s.value) }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Listing enriched - buyers now see full details!");
    navigate({ to: "/product/$id", params: { id } });
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Add more info</h1>
      <p className="mt-1 text-sm text-muted-foreground">Richer listings sell faster - Jiji-style buyers love details.</p>
      <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Condition</Label>
            <select value={f.condition} onChange={(e) => setForm({ ...f, condition: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
              <option value="new">Brand new</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div><Label>Brand</Label><Input value={f.brand} onChange={(e) => setForm({ ...f, brand: e.target.value })} placeholder="e.g. HP" /></div>
          <div><Label>Model</Label><Input value={f.model} onChange={(e) => setForm({ ...f, model: e.target.value })} placeholder="e.g. EliteBook 840" /></div>
        </div>
        <div><Label>Full description</Label><Textarea rows={5} value={f.description} onChange={(e) => setForm({ ...f, description: e.target.value })} placeholder="Tell buyers everything: quality, size, warranty, why it's great..." /></div>
        <div>
          <Label>Extra photos</Label>
          <ImageUpload value="" onChange={(url: string) => setForm({ ...f, images: [...f.images, url] })} />
          <div className="mt-2 flex flex-wrap gap-2">
            {f.images.map((img: string, i: number) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="size-16 rounded-lg border border-border object-cover" />
                <button onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Key details (specs)</Label>
          <div className="mt-2 space-y-2">
            {f.specs.map((s: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={s.label} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, label: e.target.value } : x)) })} placeholder="e.g. RAM" />
                <Input value={s.value} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, value: e.target.value } : x)) })} placeholder="e.g. 8GB" />
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...f, specs: f.specs.filter((_: any, xi: number) => xi !== i) })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setForm({ ...f, specs: [...f.specs, { label: "", value: "" }] })}><Plus className="size-4" /> Add detail row</Button>
        </div>
        <Button size="lg" className="w-full" onClick={save}>Save & publish details</Button>
      </div>
    </div>
  );
}`;
files['src/routes/product.$id.tsx'] = `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, MapPin, MessageCircle, Minus, Phone, Plus, ShieldCheck, ShoppingBasket, Store, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoryName, getCounty } from "@/data/markets";
import { addToCart, formatKes } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
export const Route = createFileRoute("/product/$id")({ component: ProductPage });
function ProductPage() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors!inner(id, user_id, shop_name, slug, county_slug, market_name, phone, whatsapp, followers_count, status)").eq("id", id).maybeSingle();
      return data;
    },
  });
  if (!product) return <p className="py-16 text-center text-muted-foreground">Loading product...</p>;
  const county = getCounty(product.vendors.county_slug);
  const gallery = ([product.image_url].concat((product.images as string[]) || [])).filter(Boolean) as string[];
  const specs = (product.specs as { label: string; value: string }[]) || [];
  const isOwner = !!session && session.user.id === product.vendors.user_id;
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors.shop_name, title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-3" />
        <Link to="/browse" className="hover:underline">Shop</Link><ChevronRight className="size-3" />
        <Link to="/browse" search={{ category: product.category_slug }} className="hover:underline">{categoryName(product.category_slug)}</Link>
        {product.subcategory ? (<><ChevronRight className="size-3" /><span>{product.subcategory}</span></>) : null}
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            {gallery[img] ? <img src={gallery[img]} alt={product.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground"><ShoppingBasket className="size-16" /></div>}
            <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-3 top-3" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setImg(i)} className={"size-16 shrink-0 overflow-hidden rounded-lg border-2 " + (i === img ? "border-accent" : "border-border")}>
                  <img src={g} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={"rounded-full px-3 py-1 font-semibold " + (product.condition === "used" ? "bg-warning/20 text-foreground" : "bg-success/15 text-success")}>{product.condition === "used" ? "Used" : "Brand new"}</span>
            {product.brand ? <span className="rounded-full bg-secondary px-3 py-1 font-medium">{product.brand}</span> : null}
            {product.model ? <span className="rounded-full bg-secondary px-3 py-1 font-medium">{product.model}</span> : null}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">{product.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" /> {product.vendors.market_name} · {county ? county.county : ""}</p>
          <p className="mt-4 font-display text-4xl font-extrabold text-accent-deep">{formatKes(Number(product.price_kes))}<span className="text-sm font-normal text-muted-foreground"> /{product.unit}</span></p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-border">
              <button className="px-3 py-2 hover:bg-secondary" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="less"><Minus className="size-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button className="px-3 py-2 hover:bg-secondary" onClick={() => setQty(qty + 1)} aria-label="more"><Plus className="size-4" /></button>
            </div>
            <Button size="lg" disabled={product.stock <= 0} onClick={add}><ShoppingBasket className="size-5" /> {product.stock <= 0 ? "Sold out" : "Add to basket"}</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{product.stock > 0 ? product.stock + " in stock" : "Out of stock"}</p>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <Link to="/shop/$slug" params={{ slug: product.vendors.slug }} className="flex items-center gap-1 font-semibold hover:underline">{product.vendors.shop_name} <BadgeCheck className="size-4 text-accent" /></Link>
                <p className="text-xs text-muted-foreground">{product.vendors.followers_count ?? 0} followers · verified trader</p>
              </div>
              <FollowButton vendorId={product.vendors.id} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.vendors.phone ? <a href={"tel:" + product.vendors.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"><Phone className="size-3.5" /> Call seller</a> : null}
              {product.vendors.whatsapp ? <a href={"https://wa.me/" + product.vendors.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><MessageCircle className="size-3.5" /> WhatsApp</a> : null}
              {isOwner ? <Link to="/enrich/$id" params={{ id: product.id }} className="flex items-center gap-1 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-deep">Add more info</Link> : null}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs text-foreground">
            <ShieldCheck className="size-4 shrink-0 text-warning" />
            <p><strong>Safety tips:</strong> meet in public, inspect before paying, never pay upfront for delivery you did not arrange.</p>
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{product.description || "The trader has not added a description yet."}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Key details</h2>
          {specs.length > 0 ? (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-muted-foreground">{s.label}</td>
                    <td className="py-2 font-semibold">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No extra specs yet - the trader can add them anytime.</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4" /> Delivery or pickup arranged with the trader at checkout.</div>
        </div>
      </div>
    </div>
  );
}`;
for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: jiji-grade products + mobile nav');