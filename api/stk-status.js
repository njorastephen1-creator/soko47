export default async function handler(req, res) {
  const invoice = String(req.query.invoice || "");
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  const paths = [
    "/payment/invoice/" + invoice + "/status/",
    "/payment/invoice/" + invoice + "/",
    "/payment/mpesa-stk-push/" + invoice + "/status/"
  ];
  try {
    for (const p of paths) {
      const r = await fetch(base + p, { headers: { Accept: "application/json", Authorization: "Bearer " + process.env.INTASEND_SECRET } });
      if (r.ok) { const data = await r.json().catch(() => ({})); res.status(200).json(data); return; }
    }
    res.status(404).json({ error: "status endpoint not found" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
