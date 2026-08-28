import fs from 'fs';
let c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');

const OLD = `  const markStatus = async (orderId: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order updated");
  };`;

const NEW = `  const markStatus = async (orderId: string, patch: any) => {
    const { data: orderRow } = await supabase.from("orders").select("buyer_id").eq("id", orderId).maybeSingle();
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return toast.error(error.message);
    if (orderRow && orderRow.buyer_id) {
      let title = "Order update";
      let body = "Your order status was updated.";
      if (patch.status === "fulfilled") { title = "Order fulfilled"; body = "Good news! Your order is fulfilled. The trader will contact you for delivery or pickup."; }
      else if (patch.payment_status === "paid") { title = "Payment confirmed"; body = "Your payment was confirmed. The trader is now preparing your order."; }
      const { error: nErr } = await supabase.from("notifications").insert({ user_id: orderRow.buyer_id, title: title, body: body, link: "/orders", read: false });
      if (nErr) console.error("notification insert failed:", nErr.message);
    }
    qc.invalidateQueries();
    toast.success("Order updated");
  };`;

if (!c.includes(OLD)) { console.log('markStatus not found'); process.exit(1); }
c = c.split(OLD).join(NEW);
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', c);
console.log('markStatus now notifies the buyer');