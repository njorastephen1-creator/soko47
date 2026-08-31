import fs from 'fs';
console.log('=== reviews table structure ===');
const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";

const r1 = await fetch(BASE + "/rest/v1/reviews?select=*&limit=1", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } });
const rows1 = await r1.json();
console.log(rows1[0] ? Object.keys(rows1[0]).join(', ') : 'no reviews table or empty');

console.log('\n=== orders page ===');
console.log(fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8').substring(0, 3000));

console.log('\n=== shop page ===');
console.log(fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8').substring(0, 3000));