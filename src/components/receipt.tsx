import { Printer, Share2 } from "lucide-react";
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
