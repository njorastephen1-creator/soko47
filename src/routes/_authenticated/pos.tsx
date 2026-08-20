import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReceiptView } from "@/components/receipt";
export const Route = createFileRoute("/_authenticated/pos")({ component: PosPage });
type Line = { title: string; price: number; qty: number };
function PosPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [active, setActive] = useState<any>(null);
  const { data: myVendor } = useQuery({
    queryKey: ["my-vendor-pos", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: myProducts } = useQuery({
    queryKey: ["pos-products", myVendor ? myVendor.id : "none"],
    enabled: !!myVendor,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, price_kes").eq("vendor_id", myVendor!.id).order("title");
      return data || [];
    },
  });
  const { data: past } = useQuery({
    queryKey: ["receipts", myVendor ? myVendor.id : "none"],
    enabled: !!myVendor,
    queryFn: async () => {
      const { data } = await supabase.from("receipts").select("*").eq("vendor_id", myVendor!.id).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });
  const { data: incoming } = useQuery({
    queryKey: ["incoming-orders", myVendor ? myVendor.id : "none"],
    enabled: !!myVendor,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("order_id, qty, price_kes, products(title), orders(*)").eq("vendor_id", myVendor!.id).order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
  });
  if (!myVendor) return <p className="py-16 text-center text-muted-foreground">Open a trader shop first to use the POS.</p>;
  const shopUrl = typeof window !== "undefined" ? window.location.origin + "/shop/" + myVendor.slug : "";
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const addLine = (t: string, p: number) => setLines((prev) => {
    const ex = prev.find((x) => x.title === t);
    if (ex) return prev.map((x) => (x.title === t ? { ...x, qty: x.qty + 1 } : x));
    return [...prev, { title: t, price: p, qty: 1 }];
  });
  const setQty = (t: string, d: number) => setLines((prev) => prev.map((x) => (x.title === t ? { ...x, qty: Math.max(1, x.qty + d) } : x)));
  const gen = async () => {
    if (lines.length === 0) return toast.error("Add at least one item");
    const { data: maxRow } = await supabase.from("receipts").select("receipt_no").eq("vendor_id", myVendor.id).order("receipt_no", { ascending: false }).limit(1);
    const nextNo = (maxRow && maxRow[0] ? Number(maxRow[0].receipt_no) : 0) + 1;
    const { data, error } = await supabase.from("receipts").insert({ vendor_id: myVendor.id, receipt_no: nextNo, customer_name: customer.trim() || null, items: lines, total_kes: total, payment_method: method, note: note.trim() || null }).select().single();
    if (error) return toast.error(error.message);
    setActive({ ...data, vendor: myVendor });
    qc.invalidateQueries();
    toast.success("Receipt #" + nextNo + " ready");
  };
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
      map[row.order_id].items.push({ title: row.products ? row.products.title : "Item", qty: row.qty, price: Number(row.price_kes) });
      map[row.order_id].total += Number(row.price_kes) * row.qty;
    });
    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  })();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">POS & Receipts</h1>
      <p className="mt-1 text-sm text-muted-foreground">Supermarket-style receipts with your unique QR - print hard copies or share as PDF.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Your products - tap to add</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(myProducts || []).map((p: any) => (
                <button key={p.id} onClick={() => addLine(p.title, Number(p.price_kes))} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent/20">+ {p.title} · {formatKes(Number(p.price_kes))}</button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div className="min-w-32 flex-1"><Label>Custom item</Label><Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Shopping bag" /></div>
              <div className="w-28"><Label>Price</Label><Input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="50" /></div>
              <Button variant="outline" onClick={() => { const p = Number(customPrice); if (!customName.trim() || !p) return toast.error("Name and price needed"); addLine(customName.trim(), p); setCustomName(""); setCustomPrice(""); }}><Plus className="size-4" /> Add</Button>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Receipt lines</h2>
            {lines.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No items yet - tap your products above.</p>}
            <div className="mt-2 space-y-2">
              {lines.map((l) => (
                <div key={l.title} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{l.title}</span>
                  <button onClick={() => setQty(l.title, -1)} className="rounded bg-secondary p-1"><Minus className="size-3" /></button>
                  <span className="w-6 text-center">{l.qty}</span>
                  <button onClick={() => setQty(l.title, 1)} className="rounded bg-secondary p-1"><Plus className="size-3" /></button>
                  <span className="w-24 text-right font-semibold">{formatKes(l.price * l.qty)}</span>
                  <button onClick={() => setLines((prev) => prev.filter((x) => x.title !== l.title))} className="text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><Label>Customer name (optional)</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in customer" /></div>
              <div><Label>Payment method</Label><select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"><option>Cash</option><option>M-Pesa</option><option>Card</option><option>Bank transfer</option></select></div>
            </div>
            <div className="mt-3"><Label>Note (optional)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Thank you for shopping!" /></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-2xl font-extrabold">Total: {formatKes(total)}</p>
              <Button size="lg" onClick={gen}><ReceiptText className="size-5" /> Generate receipt</Button>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Incoming orders</h2>
            <div className="mt-2 space-y-3">
              {orderGroups.length === 0 && <p className="text-sm text-muted-foreground">No incoming orders yet - they land here the second a buyer checks out.</p>}
              {orderGroups.map((g: any) => (
                <div key={g.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{new Date(g.created_at).toLocaleString()}</span>
                    <span className={"rounded-full px-2 py-0.5 font-semibold " + (g.status === "fulfilled" ? "bg-success/15 text-success" : "bg-warning/20 text-foreground")}>{g.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{g.buyer_name} · <a className="underline" href={"tel:" + g.buyer_phone}>{g.buyer_phone}</a></p>
                  <p className="text-xs text-muted-foreground">{g.delivery_location || "Pickup at stall"}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {g.items.map((i: any, x: number) => (<div key={x} className="flex justify-between"><span>{i.title} x{i.qty}</span><span>{formatKes(i.price * i.qty)}</span></div>))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{formatKes(g.total)}</p>
                    <div className="flex gap-2">
                      {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}
                      {g.status !== "fulfilled" && <Button size="sm" onClick={() => markStatus(g.id, { status: "fulfilled" })}>Fulfill</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent receipts</h2>
            <div className="mt-2 space-y-1">
              {(past || []).map((r: any) => (
                <button key={r.id} onClick={() => setActive({ ...r, vendor: myVendor })} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                  <span>#{String(r.receipt_no).padStart(4, "0")} · {r.customer_name || "Walk-in"} · {new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold">{formatKes(Number(r.total_kes))}</span>
                </button>
              ))}
              {(past || []).length === 0 && <p className="text-sm text-muted-foreground">No receipts yet.</p>}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 text-center">
            <h2 className="font-semibold">Your unique QR</h2>
            <p className="mt-1 text-xs text-muted-foreground">On every receipt. Scanning opens your verified shop - proof you are real + free marketing.</p>
            <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-3"><QRCodeSVG value={shopUrl} size={140} /></div>
            <p className="mt-2 text-xs font-medium">{myVendor.shop_name}</p>
          </div>
          {active ? <ReceiptView receipt={active} /> : null}
        </div>
      </div>
    </div>
  );
}
