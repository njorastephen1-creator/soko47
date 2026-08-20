import fs from 'fs';
if (!fs.existsSync('api')) fs.mkdirSync('api');
fs.writeFileSync('api/stk.js', `export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { phone, amount, reference, name } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  try {
    let ph = String(phone || "").replace(/\\s+/g, "");
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
`);
fs.writeFileSync('api/stk-status.js', `export default async function handler(req, res) {
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
`);
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (vendor.includes('const state = String(s.state || s.status || "").toLowerCase();')) {
  vendor = vendor.split('const state = String(s.state || s.status || "").toLowerCase();').join('const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase();');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Status parser hardened');
}
console.log('DONE: official v1 endpoints');