import fs from 'fs';

console.log('=== index.tsx (home page) ===');
console.log(fs.readFileSync('src/routes/index.tsx', 'utf8'));

console.log('\n=== vendors columns (for SMS phone) ===');
const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";
const r = await fetch(BASE + "/rest/v1/vendors?select=*&limit=1", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } });
const rows = await r.json();
console.log(rows[0] ? Object.keys(rows[0]).join(', ') : 'no vendors');