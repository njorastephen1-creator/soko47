import fs from 'fs';
import path from 'path';
const dirs = ['src/routes', 'src/routes/_authenticated'];
let target = null;
let routePath = null;
for (const d of dirs) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.tsx')) continue;
    const c = fs.readFileSync(path.join(d, f), 'utf8');
    if (c.includes('Official sales receipt')) {
      target = path.join(d, f);
      const m = c.match(/createFileRoute\("([^"]+)"\)/);
      routePath = m ? m[1] : null;
      break;
    }
  }
  if (target) break;
}
if (!target || !routePath) { console.log('WARNING: receipt page not found'); process.exit(0); }
console.log('Found receipt page:', target, routePath);
fs.writeFileSync(target, `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("` + routePath + `")({ component: ReceiptPage });
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
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">Ordered by mistake?</p>
          <p className="mt-1 text-muted-foreground">You can cancel while the order is pending - the trader is notified instantly.</p>
          <Button variant="destructive" size="sm" className="mt-2" onClick={cancel}><XCircle className="size-4" /> Cancel this order</Button>
        </div>
      ) : null}
    </div>
  );
}
`);
console.log('DONE: receipt with QR + items + cancel');