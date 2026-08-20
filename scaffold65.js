import fs from 'fs';
fs.writeFileSync('src/components/receipt.tsx', `import { Printer, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export function ReceiptView({ receipt }: { receipt: any }) {
  const v = receipt.vendor;
  const shopUrl = typeof window !== "undefined" ? window.location.origin + "/shop/" + v.slug : "";
  const items = (receipt.items as { title: string; price: number; qty: number }[]) || [];
  return (
    <div>
      <div id="receipt-area" className="rounded-2xl border border-dashed border-border bg-white p-5 font-mono text-[12px] text-black">
        <p className="text-center text-base font-bold uppercase">{v.shop_name}</p>
        <p className="text-center">{v.market_name}</p>
        <p className="text-center">Soko47 verified trader</p>
        <p className="mt-2 text-center">Receipt #{String(receipt.receipt_no).padStart(4, "0")}</p>
        <p className="text-center">{new Date(receipt.created_at).toLocaleString()}</p>
        {receipt.customer_name ? <p className="text-center">Customer: {receipt.customer_name}</p> : null}
        <div className="my-2 border-t border-dashed border-black" />
        {items.map((i, x) => (
          <div key={x} className="flex justify-between gap-2">
            <span>{i.title} x{i.qty}</span>
            <span>{formatKes(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between font-bold"><span>TOTAL</span><span>{formatKes(Number(receipt.total_kes))}</span></div>
        <p>Paid via: {receipt.payment_method}</p>
        {receipt.note ? <p className="mt-1">{receipt.note}</p> : null}
        <div className="mt-3 flex flex-col items-center">
          <QRCodeSVG value={shopUrl} size={90} />
          <p className="mt-1 text-center">Scan to verify this trader & shop again</p>
        </div>
        <p className="mt-2 text-center">Thank you for shopping with us!</p>
        <p className="text-center">Powered by Soko47</p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => { toast.info("In the print dialog choose 'Save as PDF' to share"); setTimeout(() => window.print(), 600); }}><Share2 className="size-4" /> Share PDF</Button>
      </div>
    </div>
  );
}
`);
console.log('Created receipt component');
fs.writeFileSync('src/routes/_authenticated/pos.tsx', `import { createFileRoute } from "@tanstack/react-router";
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
`);
console.log('Created POS page');
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('POS & Receipts</Link>')) {
  chrome = chrome.split('{myVendor && <Link to="/vendor" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Shop dashboard</Link>}').join('{myVendor && <Link to="/vendor" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">Shop dashboard</Link>}\n              {myVendor && <Link to="/pos" onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm hover:bg-secondary">POS & Receipts</Link>}');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Drawer: POS link added');
}
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (!prod.includes('Close video')) {
  prod = prod.split(`          ) : (
            <div className="overflow-hidden rounded-3xl border border-border bg-black">
              {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
            </div>
          )}`).join(`          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Product video</h2>
                <button onClick={() => setShowVideo(false)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Close video</button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-black">
                {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
              </div>
            </div>
          )}`);
  console.log('Close video added');
}
if (prod.includes('aspect-video w-full')) {
  prod = prod.split('aspect-video w-full').join('aspect-video w-full max-w-sm');
  console.log('Video now small');
}
fs.writeFileSync('src/routes/product.$id.tsx', prod);
const cssCandidates = ['src/index.css', 'src/styles.css', 'src/app.css', 'src/styles/index.css'];
let cssFile = null;
for (const c of cssCandidates) if (fs.existsSync(c)) { cssFile = c; break; }
if (cssFile) {
  let css = fs.readFileSync(cssFile, 'utf8');
  if (!css.includes('#receipt-area')) {
    css += '\n@media print {\n  body * { visibility: hidden; }\n  #receipt-area, #receipt-area * { visibility: visible; }\n  #receipt-area { position: absolute; left: 0; top: 0; width: 76mm; margin: 0; border: none; }\n}\n';
    fs.writeFileSync(cssFile, css);
    console.log('Print CSS added to', cssFile);
  }
} else console.log('WARNING: css file not found');
console.log('DONE: POS + receipts + small video');