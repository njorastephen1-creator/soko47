import fs from 'fs';
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
let n = 0;
if (!pay.includes('auto-fired')) {
  pay = pay.split('import { Copy, ExternalLink, Phone } from "lucide-react";').join('import { Copy, ExternalLink, Phone } from "lucide-react";\nimport { useEffect, useRef } from "react";');
  pay = pay.split('  const copy = (text: string, label: string) => {').join(`  const fired = useRef(false);
  useEffect(() => {
    // auto-fired: buyer gets the trader's M-Pesa prompt without tapping anything
    if (fired.current || !groups.length) return;
    const connected = groups.filter((g: any) => g.v.intasend_publishable);
    if (connected.length !== 1) return;
    fired.current = true;
    const g = connected[0];
    toast.info("Connecting you to " + g.v.shop_name + "'s secure M-Pesa...");
    (async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const r = await fetch("https://api.intasend.com/api/v1/payment/checkout-link/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_public_key: g.v.intasend_publishable, amount: String(g.total), currency: "KES", api_ref: id.slice(0, 8) + "-" + g.v.id.slice(0, 4), phone_number: order.buyer_phone, first_name: order.buyer_name, last_name: "", email: "buyer@soko47.co.ke", redirect_url: origin + "/orders", host: origin })
        });
        const d = await r.json().catch(() => ({}));
        const url = d.url || d.checkout_url || d.link;
        if (url) setTimeout(() => { window.location.href = url; }, 1200);
      } catch { }
    })();
  }, [groups.length]);
  const copy = (text: string, label: string) => {`);
  n++;
}
if (n > 0) { fs.writeFileSync('src/routes/pay.$id.tsx', pay); console.log('DONE: auto prompt after order'); }
else console.log('WARNING: nothing matched');