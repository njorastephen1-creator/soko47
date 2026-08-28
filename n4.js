const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";

async function test() {
  const r = await fetch(BASE + "/rest/v1/orders?select=*&limit=1", {
    headers: { apikey: ANON, Authorization: "Bearer " + ANON }
  });
  const rows = await r.json();
  console.log('orders columns:', rows[0] ? Object.keys(rows[0]).join(', ') : 'no rows');
  console.log(JSON.stringify(rows[0], null, 2));
}
test();