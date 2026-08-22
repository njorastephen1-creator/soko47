import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Package, Plus, Store, Users } , AlertTriangle, Bike, CheckCircle2, MessageCircle, Plus, Store } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stkPush, stkStatus } from "@/lib/mpesa";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
import { formatKes } from "@/lib/cart";
import { getCounty } from "@/data/markets";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { Stars, ratingOf } from "@/components/reviews";
export const Route = createFileRoute("/_authenticated/vendor")({ component: VendorDashboard });
function VendorDashboard() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { vendor, vendors } = useMyVendor();
  const { data: products } = useQuery({
    queryKey: ["vendor-products", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: incoming } = useQuery({
    queryKey: ["vendor-incoming", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("order_id, quantity, unit_price_kes, title, orders(*)").eq("vendor_id", vendor!.id).order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
  });
  const [payPhone, setPayPhone] = useState("");
  const [prodFilter, setProdFilter] = useState("all");
  const [prodSearch, setProdSearch] = useState("");
  const [offers, setOffers] = useState<any>({});
  const [np, setNp] = useState<any>({ title: "", price: "", offer: "", stock: "", category: "produce", unit: "piece", condition: "brand new", image: "", imageUrl: "", brand: "", desc: "" });
  const addProduct = async () => {
    if (!vendor) return;
    if (np.title.trim().length < 2) return toast.error("Give the product a name");
    const price = Number(np.price);
    if (!price || price <= 0) return toast.error("Set a selling price");
    const { error } = await supabase.from("products").insert({ vendor_id: vendor.id, title: np.title.trim(), price_kes: price, stock: Number(np.stock) || 0, category_slug: np.category, unit: np.unit || "piece", condition: np.condition, brand: np.brand.trim() || null, offer_price_kes: Number(np.offer) > 0 ? Number(np.offer) : null, image_url: np.image || np.imageUrl.trim() || null, description: np.desc.trim() || null, is_active: true });
    if (error) return toast.error(error.message);
    setNp({ title: "", price: "", stock: "", category: "produce", unit: "piece", image: "", desc: "" });
    qc.invalidateQueries();
    toast.success("Product live on the market!");
  };
  const [newShop, setNewShop] = useState("");
  const switchShop = async (id: string) => {
    await supabase.from("user_profiles").upsert({ user_id: session.user.id, active_vendor_id: id });
    qc.invalidateQueries();
    toast.success("Switched shop - whole dashboard follows");
  };
  const openShop = async () => {
    if (newShop.trim().length < 2) return toast.error("Name the new shop");
    const { data, error } = await supabase.from("vendors").insert({ user_id: session.user.id, shop_name: newShop.trim(), slug: newShop.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36), county_slug: vendor ? vendor.county_slug : "nairobi", market_name: vendor ? vendor.market_name : null, subscription_plan: "trial", status: "active" }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("user_profiles").upsert({ user_id: session.user.id, active_vendor_id: data.id });
    setNewShop("");
    qc.invalidateQueries();
    toast.success("New shop opened - pick its plan!");
  };
  const [rails, setRails] = useState<any>(null);
  const rr = rails || (vendor ? { phone: vendor.pay_phone || "", till: vendor.till_number || "", pub: vendor.intasend_publishable || "", s47: !!vendor.soko47_pay } : null);
  const saveRails = async () => {
    if (!vendor) return;
    const { error } = await supabase.from("vendors").update({ pay_phone: rr.phone.trim() || null, till_number: rr.till.trim() || null, intasend_publishable: rr.pub.trim() || null, soko47_pay: !!rr.s47 }).eq("id", vendor.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Payment details saved - customers can now pay YOU directly");
  };
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const paySubscription = async (amount: number, plan: string) => {
    if (!payPhone.trim()) return toast.error("Enter your M-Pesa phone number");
    setPaying(true);
    setPayMsg("Sending STK prompt - check your phone...");
    try {
      const d = await stkPush(payPhone.trim(), amount, "SUB-" + (vendor ? vendor.id.slice(0, 8) : "new"), vendor ? vendor.shop_name : "Soko47");
      const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id);
      if (!invoice) throw new Error(d.error || "No invoice from IntaSend");
      setPayMsg("Prompt sent - enter your M-Pesa PIN, then wait...");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          const exp = new Date(Date.now() + 30 * 864e5).toISOString();
          if (vendor) {
            await supabase.from("vendors").update({ subscription_plan: plan, subscription_expires_at: exp, status: "active" }).eq("id", vendor.id);
            qc.invalidateQueries();
          }
          toast.success("Payment received - shop unlocked for 30 days!");
          setPayMsg("PAID - asante for supporting Soko47!");
          setPaying(false);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      setPayMsg("Still pending - check your M-Pesa messages.");
    } catch (e: any) {
      toast.error(String(e.message || e));
      setPayMsg("");
    } finally { setPaying(false); }
  };
  if (!vendor) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Store className="mx-auto size-12 text-accent" />
      <h1 className="mt-3 font-display text-2xl font-bold">No trader shop yet</h1>
      <p className="mt-2 text-sm text-muted-foreground">Open your digital stall in 3 minutes and start selling to all of Kenya.</p>
      <Button asChild className="mt-4"><Link to="/sell">Open a shop</Link></Button>
    </div>
  );
  const county = getCounty(vendor.county_slug);
  const r = ratingOf(vendor);
  const markStatus = async (orderId: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order updated");
  };
  const orderGroups: any[] = (() => {
    const map: any = {};
    (incoming || []).forEach((row: any) => {
      const o = row.orders;
      if (!o) return;
      if (!map[row.order_id]) map[row.order_id] = { id: row.order_id, buyer_name: o.buyer_name, buyer_phone: o.buyer_phone, delivery_location: o.delivery_location, status: o.status, payment_status: o.payment_status, created_at: o.created_at, items: [], total: 0 };
      map[row.order_id].items.push({ title: row.title || "Item", qty: row.quantity, price: Number(row.unit_price_kes) });
      map[row.order_id].total += Number(row.unit_price_kes) * row.quantity;
    });
    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  })();
  const saveOffer = async (p: any) => {
    const val = offers[p.id];
    const num = val === "" || val == null ? null : Number(val);
    const { error } = await supabase.from("products").update({ offer_price_kes: num }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(num ? "Offer price live - buyers see the discount!" : "Offer removed");
  };
  const toggleHide = async (p: any) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(p.is_active ? "Product hidden from buyers" : "Product is live again");
  };
  const delProduct = async (p: any) => {
    if (!window.confirm("Delete " + p.title + " forever?")) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Product deleted");
  };
  const pendingCount = orderGroups.filter((g: any) => g.status === "pending").length;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">
      {(vendor.status === "blocked" || vendor.status === "suspended") ? (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold">Your shop is currently blocked - renew your subscription to start selling again.</div>
      ) : null}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Store className="size-7" /></span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold">{vendor.shop_name} <BadgeCheck className="size-5 text-accent" /></h1>
            <p className="text-sm text-muted-foreground">{vendor.market_name} · {county ? county.county : ""} · {vendor.status}</p>
            {r.count > 0 ? <p className="mt-1 flex items-center gap-2 text-xs"><Stars value={r.avg} /> {r.avg.toFixed(1)} · {r.count} reviews</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/shop/$slug" params={{ slug: vendor.slug }}>View shop</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/sell"><Plus className="size-4" /> Add product</Link></Button>
            <Button asChild size="sm"><Link to="/pos">POS & Receipts</Link></Button>
            {vendor.subscription_plan === "pro" ? <Button asChild size="sm" variant="outline"><Link to="/pro">Pro Studio</Link></Button> : null}
            <Button asChild size="sm" variant="outline"><Link to="/chats">Chats</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/profile">My profile</Link></Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-secondary p-3"><Package className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{(products || []).length}</p><p className="text-xs text-muted-foreground">Products live</p></div>
          <div className="rounded-2xl bg-secondary p-3"><Store className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending orders</p></div>
          <div className="rounded-2xl bg-secondary p-3"><Users className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{vendor.followers_count ?? 0}</p><p className="text-xs text-muted-foreground">Followers</p></div>
          <div className="rounded-2xl bg-secondary p-3"><BadgeCheck className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold capitalize">{(vendor.subscription_plan || "trial").replace("-", " ")}</p><p className="text-xs text-muted-foreground">Plan · {vendor.status}</p></div>
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>
        <p className="mt-1 text-sm text-muted-foreground">Starter KSh 499 (100 products) · Pro KSh 999 (unlimited + homepage ads + analytics). Unlocks the second M-Pesa confirms.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="w-44" placeholder="M-Pesa phone e.g. 0712..." value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
          <Button variant="outline" onClick={() => paySubscription(499, "starter")} disabled={paying}>{paying ? "Waiting..." : "Starter · KSh 499/mo"}</Button>
          <Button onClick={() => paySubscription(999, "pro")} disabled={paying}>{paying ? "Waiting..." : "Pro · KSh 999/mo"}</Button>
        </div>
        {payMsg ? <p className="mt-2 text-xs font-semibold">{payMsg}</p> : null}
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Receive payments YOUR way</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customer money goes straight to YOU - Soko47 never touches it.</p>
        <p className="mt-1 text-xs text-muted-foreground">How to get your key: create a FREE account at payment.intasend.com → verify → Integrations → API Keys → copy your ISPubKey_live_... and paste it above. Buyers then get automatic M-Pesa prompts and money lands in YOUR account.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><Label>Your M-Pesa number</Label><Input value={rr ? rr.phone : ""} onChange={(e) => setRails({ ...rr, phone: e.target.value })} placeholder="0712..." /></div>
          <div><Label>Till / Business no. (optional)</Label><Input value={rr ? rr.till : ""} onChange={(e) => setRails({ ...rr, till: e.target.value })} placeholder="e.g. 123456" /></div>
          <div><Label>Your own IntaSend key (optional)</Label><Input value={rr ? rr.pub : ""} onChange={(e) => setRails({ ...rr, pub: e.target.value })} placeholder="ISPubKey_live_..." /></div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!(rr && rr.s47)} onChange={(e) => { setRails({ ...rr, s47: e.target.checked }); supabase.from("vendors").update({ soko47_pay: e.target.checked }).eq("id", vendor.id).then(() => { qc.invalidateQueries(); toast.success(e.target.checked ? "Soko47 Pay ON - buyers now get auto prompts" : "Soko47 Pay turned off"); }); }} /> Enable Soko47 Pay - auto prompts for buyers + instant auto payouts to my M-Pesa (1% fee)</label>
        <Button className="mt-3" onClick={saveRails}>Save payment details</Button>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Incoming orders</h2>
        <div className="mt-3 space-y-3">
          {orderGroups.length === 0 && <p className="text-sm text-muted-foreground">No orders yet - share your shop link and let Kenya find you.</p>}
          {orderGroups.map((g: any) => (
            <div key={g.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{new Date(g.created_at).toLocaleString()}</span>
                <span className={"rounded-full px-2 py-0.5 font-semibold " + (g.status === "fulfilled" ? "bg-success/15 text-success" : g.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-foreground")}>{g.status}</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{g.buyer_name} · <a className="underline" href={"tel:" + g.buyer_phone}>{g.buyer_phone}</a></p>
              <p className="text-xs text-muted-foreground">{g.delivery_location || "Pickup at stall"}</p>
              {g.delivery_status && g.delivery_status !== "none" ? <p className="flex items-center gap-1 text-xs font-semibold text-accent-deep"><Bike className="size-3.5" /> Delivery: {g.delivery_status}</p> : null}
              {g.payment_status === "paid" && g.payment_ref ? <p className="flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="size-3.5" /> PAID via {g.payment_method || "M-Pesa"} · ref {String(g.payment_ref).slice(0, 8)}</p> : null}
              {g.payment_status === "paid" && !g.payment_ref ? <p className="flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="size-3.5" /> PAID</p> : null}
              {g.payment_status === "claimed" ? <p className="flex items-center gap-1 text-xs font-semibold text-warning"><AlertTriangle className="size-3.5" /> Buyer claims direct payment - check your M-Pesa SMS before fulfilling</p> : null}
              <div className="mt-2 space-y-1 text-sm">
                {g.items.map((i: any, x: number) => (<div key={x} className="flex justify-between"><span>{i.title} x{i.qty}</span><span>{formatKes(i.price * i.qty)}</span></div>))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{formatKes(g.total)}</p>
                {g.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId" params={{ vendorId: vendor.id, buyerId: g.buyer_id }}><MessageCircle className="size-4" /> Chat</Link></Button>
                    {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}
                    <Button size="sm" onClick={() => markStatus(g.id, { status: "fulfilled" })}>Fulfill</Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Store className="size-5 text-accent-deep" /> My shops</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(vendors || []).map((s: any) => (
            <button key={s.id} onClick={() => switchShop(s.id)} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (vendor && vendor.id === s.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>{s.shop_name} · {s.subscription_plan || "trial"}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="w-44" placeholder="New shop name" value={newShop} onChange={(e) => setNewShop(e.target.value)} />
          <Button size="sm" onClick={openShop}>+ Open another shop</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Each shop has its OWN subscription, products, chats & payments. Tap a pill to switch - the whole app follows.</p>
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Plus className="size-5 text-accent-deep" /> Add a product</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label>Product name</Label><Input value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} placeholder="e.g. Fresh tomatoes (kiondo)" /></div>
          <div><Label>Price (KSh)</Label><Input type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="250" /></div>
          <div><Label>Offer price (optional)</Label><Input type="number" value={np.offer} onChange={(e) => setNp({ ...np, offer: e.target.value })} placeholder="Original stays crossed out" /></div>
          <div><Label>Stock</Label><Input type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} placeholder="40" /></div>
          <div><Label>Condition</Label>
            <div className="mt-1 flex gap-2">
              {["brand new", "used"].map((cd) => (<button key={cd} type="button" onClick={() => setNp({ ...np, condition: cd })} className={"rounded-full px-3 py-1.5 text-xs font-semibold capitalize " + (np.condition === cd ? "bg-primary text-primary-foreground" : "bg-secondary")}>{cd}</button>))}
            </div>
          </div>
          <div><Label>Unit</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {["piece", "kg", "kiondo", "crate", "dozen", "bag"].map((u) => (<button key={u} type="button" onClick={() => setNp({ ...np, unit: u })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.unit === u ? "bg-primary text-primary-foreground" : "bg-secondary")}>{u}</button>))}
            </div>
          </div>
          <div className="sm:col-span-2"><Label>Category (10 like Jiji)</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]].map((c: any) => (
                <button key={c[0]} type="button" onClick={() => setNp({ ...np, category: c[0] })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.category === c[0] ? "bg-primary text-primary-foreground" : "bg-secondary")}>{c[1]}</button>
              ))}
            </div>
          </div>
          <div><Label>Upload photo</Label><ImageUpload value={np.image} onChange={(url: string) => setNp({ ...np, image: url })} /></div>
          <div><Label>Or paste photo link</Label><Input value={np.imageUrl} onChange={(e) => setNp({ ...np, imageUrl: e.target.value })} placeholder="https://..." /></div>
          <div className="sm:col-span-2"><Label>Brand (optional)</Label><Input value={np.brand} onChange={(e) => setNp({ ...np, brand: e.target.value })} placeholder="e.g. Samsung" /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea value={np.desc} onChange={(e) => setNp({ ...np, desc: e.target.value })} rows={3} placeholder="Size, quality, where it comes from..." /></div>
        </div>
        <Button className="mt-3" onClick={addProduct}>Put on the market</Button>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Your products</h2>
          <Input className="w-44" placeholder="Search products..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["all", "active", "hidden"].map((f) => (
            <button key={f} onClick={() => setProdFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (prodFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f === "active" ? "Live" : f}</button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {(products || []).filter((p: any) => (prodFilter === "all" ? true : prodFilter === "active" ? p.is_active : !p.is_active)).filter((p: any) => p.title.toLowerCase().includes(prodSearch.toLowerCase())).map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border p-2">
              <div className="flex items-center gap-3">
                {p.image_url ? <img src={p.image_url} alt="" className="size-12 rounded-lg object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title} {!p.is_active ? <span className="rounded bg-secondary px-1 text-[10px]">HIDDEN</span> : null}</p>
                  <p className="text-xs text-muted-foreground">{formatKes(Number(p.price_kes))} · stock {p.stock}{p.offer_price_kes ? " · OFFER " + formatKes(Number(p.offer_price_kes)) : ""}</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link to="/enrich/$id" params={{ id: p.id }}>More info</Link></Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input className="w-32" placeholder="Offer price" value={offers[p.id] !== undefined ? offers[p.id] : p.offer_price_kes || ""} onChange={(e) => setOffers({ ...offers, [p.id]: e.target.value })} />
                <Button size="sm" variant="outline" onClick={() => saveOffer(p)}>Save offer</Button>
                <Button size="sm" variant="outline" onClick={() => toggleHide(p)}>{p.is_active ? "Hide" : "Show"}</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p)}>Delete</Button>
              </div>
            </div>
          ))}
          {(products || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet - add your first one.</p>}
        </div>
      </div>
    </div>
  );
}
