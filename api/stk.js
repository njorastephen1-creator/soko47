export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { phone, amount, reference, name } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  try {
    let ph = String(phone || "").replace(/\s+/g, "");
    if (ph.startsWith("0")) ph = "254" + ph.slice(1);
    const parts = String(name || "Soko47 Customer").split(" ");
    const r = await fetch(base + "/payment/mpesa-stk-push/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + process.env.INTASEND_SECRET },
      body: JSON.stringify({
        amount: String(amount),
        phone_number: ph,
        api_ref: String(reference),
        first_name: parts[0] || "Soko47",
        last_name: parts.slice(1).join(" ") || "Customer",
        email: String(reference).replace(/[^a-zA-Z0-9@._-]/g, "") + "@soko47.co.ke",
        currency: "KES",
        method: "MPESA_STK_PUSH"
      })
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
