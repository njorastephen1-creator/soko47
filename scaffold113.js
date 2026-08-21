import fs from 'fs';
const f = 'src/routes/pay.$id.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('payment_method: "Soko47 Pay (auto-verified)" }).eq("id", id);') && !c.includes('auto-fulfilled')) {
  // placeholder never true; real check below
}
if (!c.includes('status: "fulfilled" } : {})')) {
  c = c.split('await supabase.from("orders").update({ payment_status: "paid", payment_ref: invoice, payment_method: "Soko47 Pay (auto-verified)" }).eq("id", id);').join('await supabase.from("orders").update({ payment_status: "paid", payment_ref: invoice, payment_method: "Soko47 Pay (auto-verified)", ...(order.delivery_status === "none" || !order.delivery_status ? { status: "fulfilled" } : {}) }).eq("id", id);');
  c = c.split('toast.success("Payment received!");').join('toast.success(order.delivery_status && order.delivery_status !== "none" ? "Payment received - rider will deliver!" : "Payment received - auto-paid & auto-fulfilled!");');
  fs.writeFileSync(f, c);
  console.log('DONE: auto paid + auto fulfil (no-delivery orders)');
} else console.log('already applied or pattern missing');