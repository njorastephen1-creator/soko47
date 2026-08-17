import fs from 'fs';
import path from 'path';
const files = {
'src/routes/cart.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingBasket, Trash2 } from "lucide-react";
import { formatKes, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/cart")({ component: CartPage });
function CartPage() {
  const { items, total } = useCart();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your basket</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <ShoppingBasket className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Your basket is empty.</p>
          <Button asChild className="mt-4"><Link to="/browse">Browse goods</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {i.imageUrl ? <img src={i.imageUrl} alt={i.title} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-6" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.title}</p>
                  <p className="text-sm text-muted-foreground">{i.shopName} · {formatKes(i.price)}/{i.unit}</p>
                </div>
                <div className="flex items-center rounded-md border border-border">
                  <button className="px-3 py-1.5" onClick={() => setQuantity(i.productId, i.quantity - 1)}>−</button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button className="px-3 py-1.5" onClick={() => setQuantity(i.productId, i.quantity + 1)}>+</button>
                </div>
                <p className="w-24 text-right font-semibold">{formatKes(i.price * i.quantity)}</p>
                <button onClick={() => removeFromCart(i.productId)} aria-label="Remove"><Trash2 className="size-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <span className="text-lg font-semibold">Total</span>
            <span className="font-display text-2xl font-extrabold">{formatKes(total)}</span>
          </div>
          <Button asChild size="lg" className="mt-5 w-full"><Link to="/checkout">Continue to checkout</Link></Button>
        </>
      )}
    </div>
  );
}`,

'src/routes/checkout.tsx': `import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearCart, formatKes, useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export const Route = createFileRoute("/checkout")({ component: Checkout });
function Checkout() {
  const { items, total } = useCart();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ buyer_name: "", buyer_phone: "", delivery_location: "", note: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.buyer_name.trim().length < 2) return toast.error("Enter your name");
    if (form.buyer_phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    if (form.delivery_location.trim().length < 3) return toast.error("Where should the goods go?");
    if (!session) { toast.error("Please sign in to place an order"); navigate({ to: "/auth" }); return; }
    setSaving(true);
    const { data: order, error } = await supabase.from("orders").insert({ buyer_id: session.user.id, buyer_name: form.buyer_name.trim(), buyer_phone: form.buyer_phone.trim(), delivery_location: form.delivery_location.trim(), note: form.note.trim() || null, total_kes: total }).select().single();
    if (error || !order) { setSaving(false); toast.error(error?.message ?? "Could not place the order"); return; }
    const { error: itemsError } = await supabase.from("order_items").insert(items.map((i) => ({ order_id: order.id, product_id: i.productId, vendor_id: i.vendorId, title: i.title, unit_price_kes: i.price, quantity: i.quantity })));
    setSaving(false);
    if (itemsError) { toast.error(itemsError.message); return; }
    clearCart();
    toast.success("Order placed — the traders will contact you shortly");
    navigate({ to: "/orders" });
  };
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Button asChild className="mt-4"><Link to="/browse">Browse goods</Link></Button>
      </div>
    );
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Delivery details</h1>
        <div className="mt-5 space-y-4">
          <div><Label htmlFor="name">Full name</Label><Input id="name" value={form.buyer_name} maxLength={80} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} /></div>
          <div><Label htmlFor="phone">Phone number</Label><Input id="phone" placeholder="07XX XXX XXX" value={form.buyer_phone} maxLength={15} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} /></div>
          <div><Label htmlFor="loc">Delivery location / pickup point</Label><Input id="loc" placeholder="Estate, town or matatu stage" value={form.delivery_location} maxLength={160} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} /></div>
          <div><Label htmlFor="note">Note for the trader (optional)</Label><Textarea id="note" maxLength={400} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        </div>
        {!loading && !session && (
          <p className="mt-4 rounded-md bg-secondary p-3 text-sm">You need an account to place an order. <Link to="/auth" className="font-medium text-accent-deep underline">Sign in or create one</Link>.</p>
        )}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={saving}>{saving ? "Placing order..." : "Place order · " + formatKes(total)}</Button>
        <p className="mt-3 text-xs text-muted-foreground">Payment is agreed directly with each trader (M-Pesa on delivery or at the stall).</p>
      </form>
      <aside className="h-fit rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span>{i.title} × {i.quantity}<span className="block text-xs text-muted-foreground">{i.shopName}</span></span>
              <span className="font-medium">{formatKes(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>{formatKes(total)}</span></div>
      </aside>
    </div>
  );
}`,

'src/routes/product.$id.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addToCart, formatKes } from "@/lib/cart";
import { categoryName, getCounty } from "@/data/markets";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/product/$id")({ component: ProductDetail });
function ProductDetail() {
  const { id } = Route.useParams();
  const [qty, setQty] = useState(1);
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name, stall_info, phone, whatsapp)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="mx-auto max-w-6xl px-4 py-16">Loading...</p>;
  if (!product)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold">Item not found</h1>
        <Link to="/browse" className="mt-2 inline-block text-accent-deep underline">Back to browsing</Link>
      </div>
    );
  const county = product.vendors ? getCounty(product.vendors.county_slug) : undefined;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
        {product.image_url ? <img src={product.image_url} alt={product.title} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-7xl text-muted-foreground">🧺</div>}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{categoryName(product.category_slug)}</p>
        <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>
        <p className="mt-4 font-display text-3xl font-extrabold">{formatKes(Number(product.price_kes))}<span className="text-base font-normal text-muted-foreground"> / {product.unit}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">{product.stock > 0 ? product.stock + " available" : "Currently sold out"}</p>
        {product.description && <p className="mt-5 whitespace-pre-line">{product.description}</p>}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-10 text-center">{qty}</span>
            <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <Button size="lg" disabled={product.stock <= 0} onClick={() => { addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url }, qty); toast.success("Added to basket"); }}>Add to basket</Button>
        </div>
        {product.vendors && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sold by</p>
            <Link to="/shop/$slug" params={{ slug: product.vendors.slug }} className="font-display text-xl font-bold">{product.vendors.shop_name}</Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><BadgeCheck className="size-4 text-accent" />Verified seller · {product.vendors.market_name}{county ? " · " + county.county + " County" : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><a href={"tel:" + product.vendors.phone}><Phone className="size-4" /> Call trader</a></Button>
              {product.vendors.whatsapp && (
                <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + product.vendors.whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,

'src/routes/shop.$slug.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCounty } from "@/data/markets";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/shop/$slug")({ component: ShopPage });
function ShopPage() {
  const { slug } = Route.useParams();
  const { data: shop, isLoading } = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: products } = useQuery({
    queryKey: ["shop-products", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name)").eq("vendor_id", shop!.id).eq("is_active", true);
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });
  if (isLoading) return <p className="mx-auto max-w-6xl px-4 py-16">Loading...</p>;
  if (!shop)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold">Shop not found</h1>
        <Link to="/browse" className="mt-2 inline-block text-accent-deep underline">Browse other goods</Link>
      </div>
    );
  const county = getCounty(shop.county_slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">{shop.shop_name.slice(0, 1)}</div>
          <div>
            <h1 className="text-3xl font-bold">{shop.shop_name}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><BadgeCheck className="size-4 text-accent" />Verified · {shop.market_name}{county ? " · " + county.county + " County" : ""}{shop.stall_info ? " · " + shop.stall_info : ""}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm"><a href={"tel:" + shop.phone}><Phone className="size-4" /> Call</a></Button>
            {shop.whatsapp && (
              <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + shop.whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
            )}
          </div>
        </div>
        {shop.description && <p className="mt-4 text-sm">{shop.description}</p>}
      </div>
      <h2 className="mt-10 text-2xl font-bold">On sale</h2>
      {products && products.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <p className="mt-3 text-muted-foreground">This shop has no active listings right now.</p>
      )}
    </div>
  );
}`,

'src/routes/_authenticated/vendor.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { CATEGORIES, COUNTIES, categoryName, getCounty } from "@/data/markets";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export const Route = createFileRoute("/_authenticated/vendor")({ component: VendorDashboard });
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
function VendorDashboard() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: vendor, isLoading } = useQuery({
    queryKey: ["my-vendor", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="mx-auto max-w-5xl px-4 py-16">Loading your shop...</p>;
  if (!vendor) return <ShopForm onDone={() => qc.invalidateQueries({ queryKey: ["my-vendor"] })} />;
  const county = getCounty(vendor.county_slug);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{vendor.shop_name}</h1>
          <p className="text-sm text-muted-foreground">{vendor.market_name}{county ? " · " + county.county + " County" : ""}</p>
        </div>
        <Button asChild variant="outline"><Link to="/shop/$slug" params={{ slug: vendor.slug }}>View public shop</Link></Button>
      </div>
      <Tabs defaultValue="products" className="mt-8">
        <TabsList>
          <TabsTrigger value="products">Listings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6"><ProductsTab vendorId={vendor.id} /></TabsContent>
        <TabsContent value="orders" className="mt-6"><OrdersTab vendorId={vendor.id} /></TabsContent>
        <TabsContent value="plan" className="mt-6"><PlanTab plan={vendor.plan} status={vendor.subscription_status} periodEnd={vendor.current_period_end} /></TabsContent>
      </Tabs>
    </div>
  );
}
function ShopForm({ onDone }: { onDone: () => void }) {
  const { session } = useSession();
  const [form, setForm] = useState({ shop_name: "", county_slug: "", market_name: "", stall_info: "", phone: "", whatsapp: "", description: "" });
  const [busy, setBusy] = useState(false);
  const county = getCounty(form.county_slug);
  const markets = county ? [county.general, county.maliMali, county.produce].filter(Boolean) : [];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.shop_name.trim().length < 2) return toast.error("Shop name is too short");
    if (!form.county_slug) return toast.error("Choose your county");
    if (!form.market_name) return toast.error("Choose your market");
    if (form.phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    setBusy(true);
    const { error } = await supabase.from("vendors").insert({ user_id: session!.user.id, shop_name: form.shop_name.trim(), slug: slugify(form.shop_name) + "-" + Math.random().toString(36).slice(2, 6), county_slug: form.county_slug, market_name: form.market_name, stall_info: form.stall_info.trim() || null, phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || null, description: form.description.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Shop created — start adding your goods");
    onDone();
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Open your shop</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tell buyers where to find you in the market. Your first 30 days are free.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div><Label htmlFor="shop">Shop name</Label><Input id="shop" maxLength={60} value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="county">County</Label>
            <select id="county" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.county_slug} onChange={(e) => setForm({ ...form, county_slug: e.target.value, market_name: "" })}>
              <option value="">Select county</option>
              {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="market">Market</Label>
            <select id="market" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.market_name} onChange={(e) => setForm({ ...form, market_name: e.target.value })}>
              <option value="">Select market</option>
              {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
        </div>
        <div><Label htmlFor="stall">Stall / shop number (optional)</Label><Input id="stall" maxLength={80} value={form.stall_info} onChange={(e) => setForm({ ...form, stall_info: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" maxLength={15} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label htmlFor="wa">WhatsApp (optional)</Label><Input id="wa" maxLength={15} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
        </div>
        <div><Label htmlFor="desc">About your shop (optional)</Label><Textarea id="desc" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating..." : "Create my shop"}</Button>
      </form>
    </div>
  );
}
function ProductsTab({ vendorId }: { vendorId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category_slug: CATEGORIES[0]!.slug, price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });
  const [busy, setBusy] = useState(false);
  const { data: products } = useQuery({
    queryKey: ["vendor-products", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 2) return toast.error("Give the item a name");
    if (!(Number(form.price_kes) > 0)) return toast.error("Price must be more than zero");
    setBusy(true);
    const { error } = await supabase.from("products").insert({ vendor_id: vendorId, title: form.title.trim(), category_slug: form.category_slug, price_kes: Number(form.price_kes), unit: form.unit.trim() || "piece", stock: Number(form.stock) || 0, description: form.description.trim() || null, image_url: form.image_url.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Listing added");
    setForm({ ...form, title: "", price_kes: "", description: "", image_url: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["vendor-products", vendorId] });
  };
  const toggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !isActive }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vendor-products", vendorId] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vendor-products", vendorId] });
  };
  return (
    <div>
      <Button onClick={() => setOpen((o) => !o)}>{open ? "Close form" : "Add a listing"}</Button>
      {open && (
        <form onSubmit={add} className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="t">Item name</Label><Input id="t" maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label htmlFor="c">Category</Label>
              <select id="c" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
                {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
              </select>
            </div>
            <div><Label htmlFor="p">Price (KSh)</Label><Input id="p" inputMode="numeric" value={form.price_kes} onChange={(e) => setForm({ ...form, price_kes: e.target.value })} /></div>
            <div><Label htmlFor="u">Unit</Label><Input id="u" maxLength={20} placeholder="piece, kg, crate, bale" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div><Label htmlFor="s">Stock available</Label><Input id="s" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div><Label htmlFor="img">Image link (optional)</Label><Input id="img" maxLength={500} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="d">Description (optional)</Label><Textarea id="d" maxLength={600} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Publish listing"}</Button>
        </form>
      )}
      <div className="mt-6 space-y-3">
        {products && products.length > 0 ? (
          products.map((p: any) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="size-14 overflow-hidden rounded-xl bg-secondary">
                {p.image_url ? <img src={p.image_url} alt={p.title} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-6" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{categoryName(p.category_slug)} · {formatKes(Number(p.price_kes))}/{p.unit} · {p.stock} in stock</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? "Hide" : "Show"}</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>Delete</Button>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No listings yet. Add your first item above.</p>
        )}
      </div>
    </div>
  );
}
function OrdersTab({ vendorId }: { vendorId: string }) {
  const qc = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["vendor-orders", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*, orders(buyer_name, buyer_phone, delivery_location)").eq("vendor_id", vendorId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("order_items").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vendor-orders", vendorId] });
  };
  if (!items || items.length === 0) return <p className="text-muted-foreground">No orders yet. Share your shop link to get started.</p>;
  return (
    <div className="space-y-3">
      {items.map((i: any) => (
        <div key={i.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{i.title} × {i.quantity}</p>
            <span className="warm-surface rounded-full px-3 py-1 text-xs font-medium capitalize">{i.status}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{i.orders?.buyer_name} · {i.orders?.buyer_phone} · {i.orders?.delivery_location}</p>
          <p className="mt-1 font-semibold">{formatKes(Number(i.unit_price_kes) * i.quantity)}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setStatus(i.id, "confirmed")}>Confirm</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus(i.id, "delivered")}>Mark delivered</Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus(i.id, "cancelled")}>Cancel</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
function PlanTab({ plan, status, periodEnd }: { plan: string; status: string; periodEnd: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">Monthly shop plan</h2>
      <p className="mt-2 text-sm text-muted-foreground">Current plan: <span className="font-medium capitalize text-foreground">{plan}</span> · status <span className="font-medium capitalize text-foreground">{status}</span> · renews {new Date(periodEnd).toLocaleDateString("en-KE")}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <p className="font-display text-2xl font-bold">KSh 300</p>
          <p className="text-sm text-muted-foreground">Starter · up to 20 listings</p>
        </div>
        <div className="rounded-xl border-2 border-accent p-5">
          <p className="font-display text-2xl font-bold">KSh 800</p>
          <p className="text-sm text-muted-foreground">Biashara · unlimited listings, featured placement</p>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">M-Pesa billing is being set up. Until then your shop stays active free of charge.</p>
    </div>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: full commerce flow');