import fs from 'fs';
fs.writeFileSync('api/stk.js', `export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { phone, amount, reference, name, till } = req.body || {};
  const base = process.env.INTASEND_BASE || "https://api.intasend.com/api/v1";
  const secret = process.env.INTASEND_SECRET;
  if (!secret) {
    res.status(500).json({ error: "INTASEND_SECRET not configured on server", details: "Add INTASEND_SECRET to Vercel Environment Variables" });
    return;
  }
  try {
    let ph = String(phone || "").replace(/\\s+/g, "");
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
`);
console.log('Serverless: till + callback + error detail');

// Client: pass till number
let mp = fs.readFileSync('src/lib/mpesa.ts', 'utf8');
if (!mp.includes('till?: string')) {
  mp = mp.split('export async function stkPush(phone: string, amount: number, reference: string, name: string)').join('export async function stkPush(phone: string, amount: number, reference: string, name: string, till?: string)');
  mp = mp.split('body: JSON.stringify({ phone: normalizePhone(phone), amount, reference, name })').join('body: JSON.stringify({ phone: normalizePhone(phone), amount, reference, name, till: till || undefined })');
  fs.writeFileSync('src/lib/mpesa.ts', mp);
  console.log('Client: till parameter added');
}

// Vendor: pass till when calling stkPush
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (v.includes('await stkPush(payPhone.trim(), 499, "SUB-"')) {
  v = v.split('await stkPush(payPhone.trim(), 499, "SUB-" + (vendor ? vendor.id.slice(0, 8) : "new"), vendor ? vendor.shop_name : "Soko47");').join('await stkPush(payPhone.trim(), 499, "SUB-" + (vendor ? vendor.id.slice(0, 8) : "new"), vendor ? vendor.shop_name : "Soko47", vendor.till_number || vendor.pay_phone || undefined);');
  v = v.split('await stkPush(payPhone.trim(), 999, "SUB-"').join('await stkPush(payPhone.trim(), 999, "SUB-"');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: passes till to stkPush');
}

// Rider: pass till when calling stkPush
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');
if (r.includes('await stkPush(payPhone.trim(), 300, "RIDER-"')) {
  r = r.split('await stkPush(payPhone.trim(), 300, "RIDER-" + rider.id.slice(0, 8), rider.name);').join('await stkPush(payPhone.trim(), 300, "RIDER-" + rider.id.slice(0, 8), rider.name, rider.pay_phone || undefined);');
  fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
  console.log('Rider: passes phone as till to stkPush');
}
console.log('DONE');