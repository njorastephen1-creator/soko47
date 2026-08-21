import fs from 'fs';
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
let n = 0;
if (pay.includes('toast.success("Payment received!");') && !pay.includes('payment_ref: invoice')) {
  pay = pay.split('await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);\n          qc.invalidateQueries();\n          toast.success("Payment received!");').join('await supabase.from("orders").update({ payment_status: "paid", payment_ref: invoice, payment_method: "Soko47 Pay (auto-verified)" }).eq("id", id);\n          qc.invalidateQueries();\n          toast.success("Payment received!");');
  n++;
}
if (pay.includes('Noted! The trader now sees your order as PAID')) {
  pay = pay.split('onClick={async () => { await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id); qc.invalidateQueries(); toast.success("Noted! The trader now sees your order as PAID"); }}>✅ I have paid - notify the trader</Button>').join('onClick={async () => { await supabase.from("orders").update({ payment_status: "claimed", payment_method: "Direct (buyer claim)" }).eq("id", id); qc.invalidateQueries(); toast.success("Trader notified to verify on their M-Pesa"); }}>💵 I paid directly (cash / M-Pesa to trader)</Button>');
  n++;
}
fs.writeFileSync('src/routes/pay.$id.tsx', pay);
console.log('Pay hub:', n);
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!vendor.includes('payment_ref')) {
  vendor = vendor.split('{g.delivery_status && g.delivery_status !== "none" ? <p className="text-xs font-semibold text-accent-deep">🛵 Delivery: {g.delivery_status}</p> : null}').join('{g.delivery_status && g.delivery_status !== "none" ? <p className="text-xs font-semibold text-accent-deep">🛵 Delivery: {g.delivery_status}</p> : null}\n              {g.payment_status === "paid" && g.payment_ref ? <p className="text-xs font-semibold text-success">✅ PAID via {g.payment_method || "M-Pesa"} · ref {String(g.payment_ref).slice(0, 8)}</p> : null}\n              {g.payment_status === "paid" && !g.payment_ref ? <p className="text-xs font-semibold text-success">✅ PAID</p> : null}\n              {g.payment_status === "claimed" ? <p className="text-xs font-semibold text-warning">⚠️ Buyer claims direct payment - check your M-Pesa SMS before fulfilling</p> : null}');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Vendor: payment evidence badges');
}
console.log('DONE');