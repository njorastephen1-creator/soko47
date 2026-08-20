import { jsPDF } from "jspdf";
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
