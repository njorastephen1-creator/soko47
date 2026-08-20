export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }
  const { phone, amount, reference, name } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  let ph = String(phone || "").replace(/\s+/g, "");
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
