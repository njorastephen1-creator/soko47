import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Printer, XCircle } from "lucide-react";
import { downloadReceiptPdf } from "@/lib/receipt-pdf";
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
      const { data } = await supabase.from("vendors").select("shop_name, market_name, slug, user_id, phone, whatsapp").eq("id", items![0].vendor_id).maybeSingle();
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
  const downloadPdf = async () => {
    await downloadReceiptPdf({
      shopName: vendor ? vendor.shop_name : "Soko47",
      marketName: vendor ? vendor.market_name : "Official sales receipt",
      receiptLabel: "Receipt #" + id.slice(0, 8),
      dateLabel: new Date(order.created_at).toLocaleString(),
      buyerLines: [order.buyer_name, order.buyer_phone, order.delivery_location || ""],
      items: (items || []).map((i: any) => ({ title: i.title, qty: i.quantity, amount: formatKes(Number(i.unit_price_kes) * i.quantity) })),
      total: formatKes(total || Number(order.total_kes)),
      status: order.status,
      qrValue: shopUrl || "https://soko47-kenya.vercel.app",
    });
  };
  const printHtml = () => {
    const qr = (document.getElementById("qr-wrap") || ({} as any)).innerHTML || "";
    const rows = (items || []).map((i: any) => "<tr><td>" + i.title + " x" + i.quantity + "</td><td style='text-align:right'>" + formatKes(Number(i.unit_price_kes) * i.quantity) + "</td></tr>").join("");
    const html = "<html><head><title>Soko47 Receipt</title><style>body{font-family:'Courier New',monospace;font-size:12px;color:#000;margin:8mm auto;width:72mm}p{margin:2px 0}.c{text-align:center}.b{font-weight:bold}hr{border:none;border-top:1px dashed #000;margin:6px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}.qr{text-align:center;margin-top:8px}</style></head><body>" +
      "<p class='c b'>" + (vendor ? vendor.shop_name.toUpperCase() : "SOKO47") + "</p>" +
      "<p class='c'>" + (vendor ? vendor.market_name : "Official sales receipt") + "</p>" +
      "<p class='c'>Soko47 verified trader</p><hr>" +
      "<p>Receipt #" + id.slice(0, 8) + "</p>" +
      "<p>" + new Date(order.created_at).toLocaleString() + "</p>" +
      "<p>Buyer: " + order.buyer_name + "</p>" +
      "<p>Tel: " + order.buyer_phone + "</p>" +
      (order.delivery_location ? "<p>" + order.delivery_location + "</p>" : "") +
      "<hr><table>" + rows + "</table><hr>" +
      "<p class='b'>TOTAL: " + formatKes(total || Number(order.total_kes)) + "</p>" +
      "<p>Status: " + order.status + "</p><hr>" +
      "<div class='qr'>" + qr + "</div>" +
      "<p class='c'>Scan to verify & reorder</p>" +
      "<p class='c'>Thank you - asante sana!</p>" +
      "<p class='c'>Powered by Soko47</p></body></html>";
    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow popups to print or share"); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={downloadPdf}><Download className="size-4" /> Download PDF</Button>
        <Button onClick={printHtml}><Printer className="size-4" /> Print</Button>
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
            <div id="qr-wrap" className="rounded-xl bg-white p-2"><QRCodeSVG value={shopUrl} size={96} /></div>
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
            {vendor && vendor.phone ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={"tel:" + vendor.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">📞 Call {vendor.shop_name}</a>
                {vendor.whatsapp ? <a href={"https://wa.me/" + vendor.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">WhatsApp trader</a> : null}
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
