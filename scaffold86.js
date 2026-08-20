import fs from 'fs';
if (!fs.existsSync('api')) fs.mkdirSync('api');
fs.writeFileSync('api/payout.js', `export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }
  const { phone, amount, reference, name } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  let ph = String(phone || "").replace(/\\s+/g, "");
  if (ph.startsWith("0")) ph = "254" + ph.slice(1);
  const body = {
    currency: "KES",
    reference: String(reference),
    narrative: "Soko47 Pay payout",
    accounts: [{ name: String(name || "Trader"), account: ph, amount: String(amount) }]
  };
  const paths = ["/payment/b2c/", "/payment/mpesa-b2c/", "/disbursements/", "/payment/send-money/"];
  try {
    for (const p of paths) {
      const r = await fetch(base + p, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + process.env.INTASEND_SECRET },
        body: JSON.stringify(body)
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) { res.status(200).json(data); return; }
      if (r.status !== 404) { res.status(r.status).json(data); return; }
    }
    res.status(404).json({ error: "payout endpoint not found" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
`);
console.log('Created payout engine');
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!vendor.includes('s47:')) {
  vendor = vendor.split('{ phone: vendor.pay_phone || "", till: vendor.till_number || "", pub: vendor.intasend_publishable || "" }').join('{ phone: vendor.pay_phone || "", till: vendor.till_number || "", pub: vendor.intasend_publishable || "", s47: !!vendor.soko47_pay }');
  vendor = vendor.split('pay_phone: rr.phone.trim() || null, till_number: rr.till.trim() || null, intasend_publishable: rr.pub.trim() || null').join('pay_phone: rr.phone.trim() || null, till_number: rr.till.trim() || null, intasend_publishable: rr.pub.trim() || null, soko47_pay: !!rr.s47');
  vendor = vendor.split('<Button className="mt-3" onClick={saveRails}>Save payment details</Button>').join('<label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!(rr && rr.s47)} onChange={(e) => setRails({ ...rr, s47: e.target.checked })} /> Enable Soko47 Pay - auto prompts for buyers + instant auto payouts to my M-Pesa (1% fee)</label>\n        <Button className="mt-3" onClick={saveRails}>Save payment details</Button>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Vendor: Soko47 Pay toggle');
}
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
if (!pay.includes('payGroup')) {
  pay = pay.split('import { useEffect, useRef } from "react";').join('import { useEffect, useRef, useState } from "react";');
  pay = pay.split('.select("id, shop_name, pay_phone, till_number, intasend_publishable, phone")').join('.select("id, shop_name, pay_phone, till_number, intasend_publishable, phone, soko47_pay")');
  pay = pay.split('  const fired = useRef(false);').join(`  const [busy, setBusy] = useState<string | null>(null);
  const doPayout = async (g: any) => {
    const gross = Math.round(g.total);
    const net = Math.round(gross * 0.99);
    const fee = gross - net;
    const r = await fetch("/api/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, amount: net, reference: "S47P-" + id.slice(0, 8) + "-" + g.v.id.slice(0, 8), name: g.v.shop_name }) });
    const d = await r.json().catch(() => ({}));
    await supabase.from("payouts").insert({ order_id: id, vendor_id: g.v.id, gross_kes: gross, fee_kes: fee, net_kes: net, status: r.ok ? "sent" : "failed", invoice_id: (d && d.invoice_id) || null }).catch(() => {});
    if (!r.ok) { toast.error("Payout queued - trader collects from dashboard"); return; }
    toast.success("Trader paid " + formatKes(net) + " instantly (1% platform fee earned)");
  };
  const payGroup = async (g: any) => {
    setBusy(g.v.id);
    try {
      const d = await stkPush(order.buyer_phone, g.total, "S47-" + id.slice(0, 8) + "-" + g.v.id.slice(0, 8), order.buyer_name);
      const invoice = d.invoice_id || d.id;
      if (!invoice) throw new Error(d.error || "No invoice");
      toast.info("M-Pesa prompt sent - enter your PIN");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
          qc.invalidateQueries();
          toast.success("Payment received!");
          if (g.v.pay_phone) await doPayout(g);
          setBusy(null);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      toast.error("Timed out - check your M-Pesa messages");
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
    setBusy(null);
  };
  const fired47 = useRef(false);
  useEffect(() => {
    if (fired47.current || !groups.length || !order) return;
    const g47 = groups.filter((g: any) => g.v.soko47_pay && g.v.pay_phone);
    if (g47.length !== 1) return;
    fired47.current = true;
    toast.info("Soko47 Pay: sending prompt for " + g47[0].v.shop_name + "...");
    payGroup(g47[0]);
  }, [groups.length, order]);
  const fired = useRef(false);`);
  pay = pay.split('const connected = groups.filter((g: any) => g.v.intasend_publishable);').join('const connected = groups.filter((g: any) => g.v.intasend_publishable && !g.v.soko47_pay);');
  pay = pay.split('{g.v.intasend_publishable ? <Button size="sm" onClick={() => prompt(g)}>').join('{g.v.soko47_pay && g.v.pay_phone ? <Button size="sm" onClick={() => payGroup(g)} disabled={busy === g.v.id}>{busy === g.v.id ? "Waiting for PIN..." : "⚡ Soko47 Pay " + formatKes(g.total)}</Button> : null}\n              {g.v.intasend_publishable ? <Button size="sm" onClick={() => prompt(g)}>');
  fs.writeFileSync('src/routes/pay.$id.tsx', pay);
  console.log('Pay hub: Soko47 Pay universal prompts');
}
console.log('DONE: Soko47 Pay engine');