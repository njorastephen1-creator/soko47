export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { phone, amount, reference, name, till } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  const secret = process.env.INTASEND_SECRET;
  if (!secret) {
    res.status(500).json({ error: "INTASEND_SECRET not configured on server", details: "Add INTASEND_SECRET to Vercel Environment Variables" });
    return;
  }
  try {
    let ph = String(phone || "").replace(/\s+/g, "");
    if (ph.startsWith("0")) ph = "254" + ph.slice(1);
    const parts = String(name || "Soko47 Customer").split(" ");
    const body = {
      amount: String(amount),
      phone_number: ph,
      api_ref: String(reference),
      first_name: parts[0] || "Soko47",
      last_name: parts.slice(1).join(" ") || "Customer",
      email: String(reference).replace(/[^a-zA-Z0-9@._-]/g, "") + "@soko47.co.ke",
      currency: "KES",
      method: "MPESA_STK_PUSH"
    };
    if (till) body.account = String(till);
    if (process.env.INTASEND_CALLBACK_URL) body.hosted_url = process.env.INTASEND_CALLBACK_URL;
    const r = await fetch(base + "/payment/mpesa-stk-push/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Bearer " + secret },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      res.status(r.status).json({ error: data.error || data.message || "STK push failed", details: data });
      return;
    }
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
