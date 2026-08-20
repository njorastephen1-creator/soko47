import fs from 'fs';
fs.writeFileSync('src/lib/receipt-pdf.ts', `import { jsPDF } from "jspdf";
import QRCode from "qrcode";
export async function downloadReceiptPdf(d: {
  shopName: string;
  marketName: string;
  receiptLabel: string;
  dateLabel: string;
  buyerLines: string[];
  items: { title: string; qty: number; amount: string }[];
  total: string;
  status?: string;
  payment?: string;
  qrValue: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: [80, 300] });
  let y = 10;
  const center = (t: string, size: number, bold: boolean) => {
    doc.setFontSize(size);
    doc.setFont("courier", bold ? "bold" : "normal");
    const w = doc.getTextWidth(t);
    doc.text(t, (80 - w) / 2, y);
    y += size * 0.6 + 1.5;
  };
  const left = (t: string, size: number, bold: boolean) => {
    doc.setFontSize(size);
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.text(t, 5, y);
    y += size * 0.6 + 1.5;
  };
  const right = (t: string, atY: number) => { doc.text(t, 75, atY, { align: "right" }); };
  const dash = () => { doc.setLineDashPattern([1, 1], 0); doc.line(5, y, 75, y); y += 3; };
  center(d.shopName.toUpperCase(), 10, true);
  center(d.marketName, 8, false);
  center("Soko47 verified trader", 8, false);
  dash();
  left(d.receiptLabel, 8, true);
  left(d.dateLabel, 8, false);
  d.buyerLines.filter(Boolean).forEach((b) => left(b, 8, false));
  dash();
  d.items.forEach((i) => {
    const yy = y;
    left(i.title + " x" + i.qty, 8, false);
    right(i.amount, yy);
  });
  dash();
  left("TOTAL: " + d.total, 9, true);
  if (d.payment) left("Paid via: " + d.payment, 8, false);
  if (d.status) left("Status: " + d.status, 8, false);
  dash();
  try {
    const qr = await QRCode.toDataURL(d.qrValue, { margin: 1, width: 256 });
    doc.addImage(qr, "PNG", 25, y, 30, 30);
    y += 33;
  } catch { }
  center("Scan to verify & reorder", 7, false);
  center("Thank you - asante sana!", 8, false);
  center("Powered by Soko47", 7, false);
  doc.save("soko47-receipt.pdf");
}
`);
console.log('Created PDF engine');
let r = fs.readFileSync('src/routes/_authenticated/receipt.$id.tsx', 'utf8');
if (!r.includes('downloadReceiptPdf')) {
  r = r.split('import { Printer, XCircle } from "lucide-react";').join('import { Download, Printer, XCircle } from "lucide-react";\nimport { downloadReceiptPdf } from "@/lib/receipt-pdf";');
  r = r.split('  const printHtml = () => {').join(`  const downloadPdf = async () => {
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
  const printHtml = () => {`);
  r = r.split('<div className="flex justify-end">').join('<div className="flex flex-wrap justify-end gap-2">');
  r = r.split('<Button onClick={printHtml}><Printer className="size-4" /> Print / Save as PDF</Button>').join('<Button variant="outline" onClick={downloadPdf}><Download className="size-4" /> Download PDF</Button>\n        <Button onClick={printHtml}><Printer className="size-4" /> Print</Button>');
  fs.writeFileSync('src/routes/_authenticated/receipt.$id.tsx', r);
  console.log('Buyer receipt: download button');
}
let c = fs.readFileSync('src/components/receipt.tsx', 'utf8');
if (!c.includes('downloadReceiptPdf')) {
  c = c.split('import { Printer, Share2 } from "lucide-react";').join('import { Download, Printer } from "lucide-react";\nimport { downloadReceiptPdf } from "@/lib/receipt-pdf";');
  c = c.split('  const printHtml = () => {').join(`  const downloadPdf = async () => {
    toast.info("PDF downloading - share it on WhatsApp");
    await downloadReceiptPdf({
      shopName: v.shop_name,
      marketName: v.market_name,
      receiptLabel: "Receipt #" + String(receipt.receipt_no).padStart(4, "0"),
      dateLabel: new Date(receipt.created_at).toLocaleString(),
      buyerLines: [receipt.customer_name || ""],
      items: items.map((i) => ({ title: i.title, qty: i.qty, amount: formatKes(i.price * i.qty) })),
      total: formatKes(Number(receipt.total_kes)),
      payment: receipt.payment_method,
      qrValue: shopUrl,
    });
  };
  const printHtml = () => {`);
  c = c.split(`      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={printHtml}><Printer className="size-4" /> Print</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => { toast.info("In the print dialog choose 'Save as PDF' to share"); printHtml(); }}><Share2 className="size-4" /> Share PDF</Button>
      </div>`).join(`      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="flex-1" onClick={downloadPdf}><Download className="size-4" /> Download PDF</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={printHtml}><Printer className="size-4" /> Print</Button>
      </div>`);
  fs.writeFileSync('src/components/receipt.tsx', c);
  console.log('POS receipt: download button');
}
console.log('DONE');