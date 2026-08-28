const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";

async function test() {
  const r = await fetch(`${BASE}/rest/v1/vendors?select=slug,shop_name,market_name&limit=5`, {
    headers: { apikey: ANON, Authorization: "Bearer " + ANON }
  });
  const vendors = await r.json();
  console.log('First 5 vendors in database:');
  console.log(JSON.stringify(vendors, null, 2));
}

test();