import fs from 'fs';
const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";

for (const col of ["user_id", "buyer_id", "buyer_user_id"]) {
  const r = await fetch(BASE + "/rest/v1/orders?select=" + col + "&limit=1", {
    headers: { apikey: ANON, Authorization: "Bearer " + ANON }
  });
  console.log(col, '->', r.status);
}

console.log('\n--- checkout rpc call ---');
const c = fs.readFileSync('src/routes/checkout.tsx', 'utf8');
c.split('\n').forEach((l, i) => { if (/rpc|place/i.test(l)) console.log((i + 1) + ': ' + l.trim()); });