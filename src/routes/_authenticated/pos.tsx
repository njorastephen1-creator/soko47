import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ReceiptText, Trash2, X } from "lucide-react";
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lines, setLines] = useState<Line[]>([]);
  const [posFilter, setPosFilter] = useState("all");
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [active, setActive] = useState<any>(null);
  const [rcFilter, setRcFilter] = useState("all");
  const [rcPage, setRcPage] = useState(0);
  const [ordPage, setOrdPage] = useState(0);
  const { data: myVendor, isLoading: mvLoading } = useQuery({
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
      const { data } = await supabase.from("receipts").select("*").eq("vendor_id", myVendor!.id).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });
  const { data: incoming } = useQuery({
    queryKey: ["incoming-orders", myVendor ? myVendor.id : "none"],
    enabled: !!myVendor,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("order_id, quantity, unit_price_kes, title, orders(*)").eq("vendor_id", myVendor!.id).order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
  });

  const isAdmin = session && session.user.email === "njorastephen1@gmail.com";
  const canDeleteOrder = (g: any) => isAdmin || ((Date.now() - new Date(g.created_at).getTime()) >= 20 * 864e5);
  const canDeleteReceipt = (r: any) => isAdmin || ((Date.now() - new Date(r.created_at).getTime()) >= 20 * 864e5);
  const daysLeftOrder = (g: any) => Math.ceil(20 - (Date.now() - new Date(g.created_at).getTime()) / 864e5);
  const daysLeftReceipt = (r: any) => Math.ceil(20 - (Date.now() - new Date(r.created_at).getTime()) / 864e5);
  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently? (Admin or 20+ days only)")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order deleted");
  };
  const deleteReceipt = async (id: string) => {
    if (!window.confirm("Delete this receipt permanently? (Admin or 20+ days only)")) return;
    const { error } = await supabase.from("receipts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Receipt deleted");
  };
  if (!mvLoading && !myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }
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
      map[row.order_id].items.push({ title: row.title || "Item", qty: row.quantity, price: Number(row.unit_price_kes) });
      map[row.order_id].total += Number(row.unit_price_kes) * row.quantity;
    });
    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  })();
  const filteredOrders = orderGroups.filter((g: any) => (posFilter === "all" ? true : g.status === posFilter));
  const ordPages = Math.max(0, Math.ceil(filteredOrders.length / 15) - 1);
  const ordSlice = filteredOrders.slice(ordPage * 15, ordPage * 15 + 15);
  const rcFiltered = (past || []).filter((r: any) => (rcFilter === "all" ? true : r.payment_method === rcFilter));
  const rcPages = Math.max(0, Math.ceil(rcFiltered.length / 15) - 1);
  const rcSlice = rcFiltered.slice(rcPage * 15, rcPage * 15 + 15);
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
            <div className="mt-2 flex flex-wrap gap-2">{["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => setPosFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (posFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>
            <div className="mt-2 space-y-3">
              {orderGroups.length === 0 && <p className="text-sm text-muted-foreground">No incoming orders yet - they land here the second a buyer checks out.</p>}
              {ordSlice.map((g: any) => (
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
                      {canDeleteOrder(g) ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteOrder(g.id)}><Trash2 className="size-4" /></Button> : <span className="text-[11px] text-muted-foreground">Delete in {daysLeftOrder(g)}d</span>}
                      {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}
                      {g.status !== "fulfilled" && <Button size="sm" onClick={() => markStatus(g.id, { status: "fulfilled" })}>Fulfill</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ordPages > 0 ? (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <button disabled={ordPage === 0} onClick={() => setOrdPage(ordPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                <span>Page {ordPage + 1} of {ordPages + 1}</span>
                <button disabled={ordPage >= ordPages} onClick={() => setOrdPage(ordPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent receipts</h2>
            <div className="mt-2 flex flex-wrap gap-2">{["all", "Cash", "M-Pesa", "Card", "Bank transfer"].map((f) => (<button key={f} onClick={() => { setRcFilter(f); setRcPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (rcFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-2">No.</th>
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Method</th>
                    <th className="py-2 pr-2 text-right">Total</th>
                    <th className="py-2 pr-2" />
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rcSlice.map((r: any) => (
                    <tr key={r.id} className="cursor-pointer border-b border-border/50 hover:bg-secondary" onClick={() => setActive({ ...r, vendor: myVendor })}>
                      <td className="py-2 pr-2 font-semibold">#{String(r.receipt_no).padStart(4, "0")}</td>
                      <td className="py-2 pr-2">{r.customer_name || "Walk-in"}</td>
                      <td className="py-2 pr-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-2 text-xs">{r.payment_method}</td>
                      <td className="py-2 pr-2 text-right font-semibold">{formatKes(Number(r.total_kes))}</td>
                      <td className="py-2 text-right text-xs font-semibold text-accent-deep">View</td>
                      <td className="py-2 text-right">{canDeleteReceipt(r) ? <button onClick={(e) => { e.stopPropagation(); deleteReceipt(r.id); }} className="text-destructive"><Trash2 className="size-3.5" /></button> : <span className="text-[10px] text-muted-foreground">{daysLeftReceipt(r)}d</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rcFiltered.length === 0 && <p className="text-sm text-muted-foreground">No receipts yet.</p>}
            </div>
            {rcPages > 0 ? (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <button disabled={rcPage === 0} onClick={() => setRcPage(rcPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                <span>Page {rcPage + 1} of {rcPages + 1}</span>
                <button disabled={rcPage >= rcPages} onClick={() => setRcPage(rcPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 text-center">
            <h2 className="font-semibold">Your unique QR</h2>
            <p className="mt-1 text-xs text-muted-foreground">On every receipt. Scanning opens your verified shop - proof you are real + free marketing.</p>
            <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-3"><QRCodeSVG value={shopUrl} size={140} /></div>
            <p className="mt-2 text-xs font-medium">{myVendor.shop_name}</p>
          </div>
        </div>
      </div>
      {active ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4" onClick={() => setActive(null)}>
          <div className="mx-auto my-8 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground" onClick={() => setActive(null)}><X className="size-4" /> Close</button>
            </div>
            <ReceiptView receipt={active} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
