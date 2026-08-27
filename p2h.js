import fs from 'fs';
const f = 'src/routes/pay.$id.tsx';
let c = fs.readFileSync(f, 'utf8');

// Remove the dangerous paid=1 useEffect entirely
const DANGEROUS_BLOCK = `  const paidDone = useRef(false);
  useEffect(() => {
    if (paidDone.current) return;
    const qs = typeof window !== "undefined" ? window.location.search : "";
    if (!qs.includes("paid=1") || !order) return;
    paidDone.current = true;
    (async () => {
      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
      qc.invalidateQueries();
      toast.success("Payment confirmed - order saved for the trader to deliver");
    })();
  }, [order]);`;

if (c.includes(DANGEROUS_BLOCK)) {
  c = c.split(DANGEROUS_BLOCK).join(`  // IntaSend redirect handler: verify server-side instead of trusting URL
  const paidDone = useRef(false);
  useEffect(() => {
    if (paidDone.current || !order) return;
    const qs = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(qs);
    const tracking_id = params.get("tracking_id") || params.get("invoice_id");
    if (!tracking_id) return;
    paidDone.current = true;
    (async () => {
      try {
        const r = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: id, invoice_id: tracking_id, provider: "intasend" })
        });
        const d = await r.json();
        if (d.success || d.already_paid) {
          qc.invalidateQueries();
          toast.success("Payment verified and confirmed");
        } else {
          toast.error("Payment verification failed: " + (d.error || "unknown"));
        }
      } catch (e: any) {
        toast.error("Could not verify payment: " + e.message);
      }
    })();
  }, [order]);`);
  console.log('removed dangerous paid=1 trust, replaced with server verification');
}

// Also update the polling loop to call the server endpoint instead of direct DB update
const POLLING_UPDATE = `        if (["complete", "completed", "paid", "success"].includes(state)) {
          await supabase.from("orders").update({ payment_status: "paid", payment_ref: invoice, payment_method: "Soko47 Pay (auto-verified)", ...(order.delivery_status === "none" || !order.delivery_status ? { status: "fulfilled" } : {}) }).eq("id", id);
          qc.invalidateQueries();
          toast.success(order.delivery_status && order.delivery_status !== "none" ? "Payment received - rider will deliver!" : "Payment received - auto-paid & auto-fulfilled!");
          if (g.v.pay_phone) fetch("/api/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, message: "Soko47: paid order " + id.slice(0, 6) + " worth " + formatKes(g.total) + " from " + order.buyer_name }) }).catch(() => {});
          if (g.v.pay_phone) await doPayout(g);
          setBusy(null);
          return;
        }`;

const POLLING_NEW = `        if (["complete", "completed", "paid", "success"].includes(state)) {
          // Verify payment server-side (amount + idempotency)
          const verifyR = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: id, invoice_id: invoice, provider: "soko47" })
          });
          const verifyD = await verifyR.json();
          if (!verifyD.success && !verifyD.already_paid) {
            toast.error("Payment verification failed: " + (verifyD.error || "unknown"));
            setBusy(null);
            return;
          }
          qc.invalidateQueries();
          toast.success("Payment verified — trader notified!");
          if (g.v.pay_phone) fetch("/api/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, message: "Soko47: verified paid order " + id.slice(0, 6) + " worth " + formatKes(g.total) + " from " + order.buyer_name }) }).catch(() => {});
          // Defer payout to webhook or manual release (dispute window)
          setBusy(null);
          return;
        }`;

if (c.includes(POLLING_UPDATE)) {
  c = c.split(POLLING_UPDATE).join(POLLING_NEW);
  console.log('polling now calls server verification');
}

fs.writeFileSync(f, c);