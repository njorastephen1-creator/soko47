import fs from 'fs';
import path from 'path';
const files = {
'src/components/image-upload.tsx': `import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export function ImageUpload({ onUrl }: { onUrl: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 4 * 1024 * 1024) return toast.error("Image must be under 4MB");
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = "products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) { setBusy(false); return toast.error("Upload failed: " + error.message); }
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    setPreview(data.publicUrl);
    onUrl(data.publicUrl);
    setBusy(false);
    toast.success("Photo uploaded");
  };
  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {busy ? "Uploading..." : "Upload photo"}
      </Button>
      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="size-12 rounded-lg border border-border object-cover" />
          <button type="button" aria-label="Remove photo" onClick={() => { setPreview(null); onUrl(""); }} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="size-3" /></button>
        </div>
      )}
    </div>
  );
}`,

'src/routes/_authenticated/vendor.tsx': `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { CATEGORIES, COUNTIES, categoryName, getCounty } from "@/data/markets";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/image-upload";
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
  const [form, setForm] = useState({ shop_name: "", county_slug: "", market_name: "", custom_market: "", stall_info: "", phone: "", whatsapp: "", description: "" });
  const [busy, setBusy] = useState(false);
  const county = getCounty(form.county_slug);
  const markets = county ? [county.general, county.maliMali, county.produce].filter(Boolean) : [];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.shop_name.trim().length < 2) return toast.error("Shop name is too short");
    if (!form.county_slug) return toast.error("Choose your county");
    const finalMarket = form.market_name === "other" ? form.custom_market.trim() : form.market_name;
    if (!finalMarket) return toast.error("Choose your market, or pick Other and type it");
    if (form.phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    setBusy(true);
    const { error } = await supabase.from("vendors").insert({ user_id: session!.user.id, shop_name: form.shop_name.trim(), slug: slugify(form.shop_name) + "-" + Math.random().toString(36).slice(2, 6), county_slug: form.county_slug, market_name: finalMarket, stall_info: form.stall_info.trim() || null, phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || null, description: form.description.trim() || null });
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
            <select id="county" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.county_slug} onChange={(e) => setForm({ ...form, county_slug: e.target.value, market_name: "", custom_market: "" })}>
              <option value="">Select county</option>
              {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="market">Market</Label>
            <select id="market" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.market_name} onChange={(e) => setForm({ ...form, market_name: e.target.value })}>
              <option value="">Select market</option>
              {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
              <option value="other">Other — my market is not listed</option>
            </select>
          </div>
        </div>
        {form.market_name === "other" && (
          <div>
            <Label htmlFor="customMarket">Type your market</Label>
            <Input id="customMarket" maxLength={80} placeholder="e.g. Awendo Market, Marimanti Market..." value={form.custom_market} onChange={(e) => setForm({ ...form, custom_market: e.target.value })} />
          </div>
        )}
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
    setForm({ title: "", category_slug: CATEGORIES[0]!.slug, price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });
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
          </div>
          <div>
            <Label>Product photo</Label>
            <div className="mt-1"><ImageUpload onUrl={(u) => setForm({ ...form, image_url: u })} /></div>
            <Input className="mt-2" maxLength={500} placeholder="or paste an image link" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
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
console.log('DONE: photo uploads');