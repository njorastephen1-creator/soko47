export default async function handler(req, res) {
  const { phone, message } = req.body || {};
  const u = process.env.AT_USERNAME, k = process.env.AT_API_KEY;
  if (!u || !k) { res.status(200).json({ skipped: true }); return; }
  try {
    let ph = String(phone || "").replace(/\s+/g, "");
    if (ph.startsWith("0")) ph = "254" + ph.slice(1);
    const r = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: String(k), Accept: "application/json" },
      body: JSON.stringify({ username: String(u), to: [ph], message: String(message) })
    });
    res.status(r.status).json(await r.json().catch(() => ({})));
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
