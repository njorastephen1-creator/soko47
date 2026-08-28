import fs from 'fs';
import path from 'path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (/\.(tsx|ts)$/.test(e.name)) return [p];
    return [];
  });
}

console.log('--- files mentioning notifications ---');
for (const f of walk('src')) {
  const c = fs.readFileSync(f, 'utf8');
  if (/notification/i.test(c)) console.log(f);
}

console.log('\n--- orders queries in vendor.tsx ---');
const v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
v.split('\n').forEach((l, i) => {
  if (l.includes('from("orders")')) console.log((i + 1) + ': ' + l.trim());
});

console.log('\n--- check notifications table ---');
const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";
const r = await fetch(BASE + "/rest/v1/notifications?select=*&limit=1", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } });
console.log('status:', r.status);
console.log(await r.text());