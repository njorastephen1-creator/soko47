import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { order_id, invoice_id, provider } = req.body;
  if (!order_id || !invoice_id) return res.status(400).json({ error: "Missing order_id or invoice_id" });
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // 1. Fetch order (verify it exists and is unpaid)
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();
  
  if (orderErr || !order) return res.status(404).json({ error: "Order not found" });
  if (order.payment_status === "paid") return res.status(200).json({ already_paid: true });
  
  // 2. Verify payment with provider (IntaSend or Soko47 gateway)
  let paid_amount = 0;
  let payment_ref = invoice_id;
  
  if (provider === "intasend") {
    // Fetch invoice status from IntaSend
    const r = await fetch(`https://api.intasend.com/api/v1/payment/checkout-status/?api_public_key=${process.env.INTASEND_PUBLIC_KEY}&tracking_id=${invoice_id}`);
    const d = await r.json();
    if (d.state !== "complete" && d.state !== "Complete") {
      return res.status(400).json({ error: "Payment not complete", state: d.state });
    }
    paid_amount = parseFloat(d.amount || 0);
    payment_ref = d.tracking_id || invoice_id;
  } else {
    // Soko47 Pay — check with your gateway
    const { stkStatus } = await import("../src/lib/mpesa.ts");
    const s = await stkStatus(invoice_id);
    const state = String((s.invoice && s.invoice.state) || s.state || "").toLowerCase();
    if (!["complete", "completed", "paid", "success"].includes(state)) {
      return res.status(400).json({ error: "Payment not complete", state });
    }
    paid_amount = parseFloat((s.invoice && s.invoice.amount) || s.amount || 0);
  }
  
  // 3. Verify amount matches (with 1 KES tolerance for rounding)
  if (Math.abs(paid_amount - parseFloat(order.total_kes)) > 1) {
    return res.status(400).json({ 
      error: "Amount mismatch", 
      expected: order.total_kes, 
      paid: paid_amount 
    });
  }
  
  // 4. Update order atomically
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ 
      payment_status: "paid", 
      payment_ref: payment_ref, 
      payment_method: provider === "intasend" ? "IntaSend (verified)" : "Soko47 Pay (verified)" 
    })
    .eq("id", order_id)
    .eq("payment_status", "unpaid"); // idempotency: only update if still unpaid
  
  if (updateErr) return res.status(500).json({ error: updateErr.message });
  
  return res.status(200).json({ success: true, paid_amount });
}
