import fs from 'fs';
let r = fs.readFileSync('src/routes/_authenticated/receipt.$id.tsx', 'utf8');
let n = 0;
if (!r.includes('const printHtml')) {
  r = r.split('  return (').join(`  const printHtml = () => {
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
  return (`);
  r = r.split('<Button onClick={() => window.print()}>').join('<Button onClick={printHtml}>');
  r = r.split('<div className="rounded-xl bg-white p-2"><QRCodeSVG value={shopUrl} size={96} /></div>').join('<div id="qr-wrap" className="rounded-xl bg-white p-2"><QRCodeSVG value={shopUrl} size={96} /></div>');
  fs.writeFileSync('src/routes/_authenticated/receipt.$id.tsx', r);
  n++;
  console.log('Buyer receipt: print window');
}
let c = fs.readFileSync('src/components/receipt.tsx', 'utf8');
if (!c.includes('const printHtml')) {
  c = c.split('  return (').join(`  const printHtml = () => {
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
  return (`);
  c = c.split('onClick={() => window.print()}').join('onClick={printHtml}');
  c = c.split('setTimeout(() => window.print(), 600);').join('printHtml();');
  c = c.split('<QRCodeSVG value={shopUrl} size={90} />').join('<span id="qr-wrap"><QRCodeSVG value={shopUrl} size={90} /></span>');
  fs.writeFileSync('src/components/receipt.tsx', c);
  n++;
  console.log('POS receipt: print window');
}
console.log(n > 0 ? 'DONE' : 'WARNING: nothing matched');