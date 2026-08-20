import fs from 'fs';
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Package, Plus, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { getCounty } from "@/data/markets";
import { Button } from "@/components/ui/button";
import { Stars, ratingOf } from "@/components/reviews";
export const Route = createFileRoute("/_authenticated/vendor")({ component: VendorDashboard });
function VendorDashboard() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: vendor } = useQuery({
    queryKey: ["my-vendor-dash", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
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
  const pendingCount = orderGroups.filter((g: any) => g.status === "pending").length;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">
      {vendor.status === "blocked" ? (
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
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-secondary p-3"><Package className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{(products || []).length}</p><p className="text-xs text-muted-foreground">Products live</p></div>
          <div className="rounded-2xl bg-secondary p-3"><Store className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending orders</p></div>
          <div className="rounded-2xl bg-secondary p-3"><Users className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{vendor.followers_count ?? 0}</p><p className="text-xs text-muted-foreground">Followers</p></div>
          <div className="rounded-2xl bg-secondary p-3"><BadgeCheck className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold capitalize">{(vendor.subscription_plan || "trial").replace("-", " ")}</p><p className="text-xs text-muted-foreground">Plan · {vendor.status}</p></div>
        </div>
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
              <div className="mt-2 space-y-1 text-sm">
                {g.items.map((i: any, x: number) => (<div key={x} className="flex justify-between"><span>{i.title} x{i.qty}</span><span>{formatKes(i.price * i.qty)}</span></div>))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{formatKes(g.total)}</p>
                {g.status === "pending" ? (
                  <div className="flex gap-2">
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
        <h2 className="font-display text-xl font-bold">Your products</h2>
        <div className="mt-3 space-y-2">
          {(products || []).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
              {p.image_url ? <img src={p.image_url} alt="" className="size-12 rounded-lg object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{formatKes(Number(p.price_kes))} · stock {p.stock}</p>
              </div>
              <Button asChild variant="outline" size="sm"><Link to="/enrich/$id" params={{ id: p.id }}>Add more info</Link></Button>
            </div>
          ))}
          {(products || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet - add your first one.</p>}
        </div>
      </div>
    </div>
  );
}
`);
console.log('Vendor dashboard rebuilt');
fs.writeFileSync('src/routes/_authenticated/receipt.$id.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/receipt/$id")({ component: ReceiptPage });
function ReceiptPage() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: order } = useQuery({
    queryKey: ["order-receipt", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
  const { data: items } = useQuery({
    queryKey: ["order-receipt-items", id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("title, quantity, unit_price_kes, vendor_id").eq("order_id", id);
      return data || [];
    },
  });
  const { data: vendor } = useQuery({
    queryKey: ["order-receipt-vendor", items && items[0] ? items[0].vendor_id : "none"],
    enabled: !!(items && items[0]),
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("shop_name, market_name, slug, user_id").eq("id", items![0].vendor_id).maybeSingle();
      return data;
    },
  });
  if (!order) return <p className="py-16 text-center text-muted-foreground">Loading receipt...</p>;
  const total = (items || []).reduce((s: number, i: any) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const shopUrl = typeof window !== "undefined" && vendor ? window.location.origin + "/shop/" + vendor.slug : "";
  const canCancel = order.status === "pending" && Date.now() - new Date(order.created_at).getTime() < 10 * 60 * 1000;
  const cancel = async () => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    const vendorIds = Array.from(new Set((items || []).map((i: any) => i.vendor_id))) as string[];
    for (const vid of vendorIds) {
      const { data: v } = await supabase.from("vendors").select("user_id, shop_name").eq("id", vid).maybeSingle();
      if (v) await supabase.from("notifications").insert({ user_id: v.user_id, title: "Order cancelled", body: (order.buyer_name || "A buyer") + " cancelled order #" + id.slice(0, 6) + " - " + v.shop_name, link: "/pos" });
    }
    qc.invalidateQueries();
    toast.success("Order cancelled - the trader has been notified");
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex justify-end">
        <Button onClick={() => window.print()}><Printer className="size-4" /> Print / Save as PDF</Button>
      </div>
      <div id="receipt-area" className="mt-4 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-bold">{vendor ? vendor.shop_name : "Soko47"}</p>
            <p className="text-xs text-muted-foreground">{vendor ? vendor.market_name : "Official sales receipt"}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Receipt #{id.slice(0, 8)}</p>
            <p>{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-3 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Buyer</p>
          <p className="font-semibold">{order.buyer_name}</p>
          <p>{order.buyer_phone}</p>
          {order.delivery_location ? <p>{order.delivery_location}</p> : null}
        </div>
        <div className="mt-3 text-sm">
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <p className={"font-semibold " + (order.status === "cancelled" ? "text-destructive" : order.status === "fulfilled" ? "text-success" : "text-warning")}>{order.status}</p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((i: any, x: number) => (
              <tr key={x} className="border-b border-border last:border-0">
                <td className="py-2">{i.title}</td>
                <td className="py-2 text-center">{i.quantity}</td>
                <td className="py-2 text-right">{formatKes(Number(i.unit_price_kes) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-between font-display text-lg font-extrabold"><span>Total</span><span>{formatKes(total || Number(order.total_kes))}</span></div>
        {shopUrl ? (
          <div className="mt-5 flex flex-col items-center border-t border-dashed border-border pt-4">
            <div className="rounded-xl bg-white p-2"><QRCodeSVG value={shopUrl} size={96} /></div>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">Scan to verify this trader & shop again on Soko47</p>
          </div>
        ) : null}
        <p className="mt-4 text-center text-xs text-muted-foreground">Asante kwa kununua kupitia Soko47 - built for Kenya's market traders.</p>
      </div>
      {order.status === "pending" ? (
        canCancel ? (
          <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="font-semibold">Ordered by mistake?</p>
            <p className="mt-1 text-muted-foreground">You have 10 minutes to cancel - after that the trader starts preparing your order.</p>
            <Button variant="destructive" size="sm" className="mt-2" onClick={cancel}><XCircle className="size-4" /> Cancel this order</Button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-semibold">🔒 Order locked in</p>
            <p className="mt-1 text-muted-foreground">The trader is already preparing your goods - asante for shopping local! 🇰</p>
          </div>
        )
      ) : null}
    </div>
  );
}
`);
console.log('Receipt rebuilt with 10-min rule');
console.log('DONE');