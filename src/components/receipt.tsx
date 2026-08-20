import { Printer, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export function ReceiptView({ receipt }: { receipt: any }) {
  const v = receipt.vendor;
  const shopUrl = typeof window !== "undefined" ? window.location.origin + "/shop/" + v.slug : "";
  const items = (receipt.items as { title: string; price: number; qty: number }[]) || [];
  const printHtml = () => {
    const qr = (document.getElementById("qr-wrap") || ({} as any)).innerHTML || "";
    const rows = items.map((i) => "<tr><td>" + i.title + " x" + i.qty + "</td><td style='text-align:right'>" + formatKes(i.price * i.qty) + "</td></tr>").join("");
    const html = "<html><head><title>Soko47 Receipt</title><style>body{font-family:'Courier New',monospace;font-size:12px;color:#000;margin:8mm auto;width:72mm}p{margin:2px 0}.c{text-align:center}.b{font-weight:bold}hr{border:none;border-top:1px dashed #000;margin:6px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}.qr{text-align:center;margin-top:8px}</style></head><body>" +
      "<p class='c b'>" + v.shop_name.toUpperCase() + "</p>" +
      "<p class='c'>" + v.market_name + "</p>" +
      "<p class='c'>Soko47 verified trader</p><hr>" +
      "<p>Receipt #" + String(receipt.receipt_no).padStart(4, "0") + "</p>" +
      "<p>" + new Date(receipt.created_at).toLocaleString() + "</p>" +
      (receipt.customer_name ? "<p>Customer: " + receipt.customer_name + "</p>" : "") +
      "<hr><table>" + rows + "</table><hr>" +
      "<p class='b'>TOTAL: " + formatKes(Number(receipt.total_kes)) + "</p>" +
      "<p>Paid via: " + receipt.payment_method + "</p><hr>" +
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
          <span id="qr-wrap"><QRCodeSVG value={shopUrl} size={90} /></span>
          <p className="mt-1 text-center">Scan to verify this trader & shop again</p>
        </div>
        <p className="mt-2 text-center">Thank you for shopping with us!</p>
        <p className="text-center">Powered by Soko47</p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={printHtml}><Printer className="size-4" /> Print</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => { toast.info("In the print dialog choose 'Save as PDF' to share"); printHtml(); }}><Share2 className="size-4" /> Share PDF</Button>
      </div>
    </div>
  );
}
