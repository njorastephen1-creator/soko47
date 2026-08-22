import fs from 'fs';

// 1) Rider queries join vendor contact so rider can call the seller
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');
if (!r.includes('vendors(shop_name, pay_phone)')) {
  r = r.split('const { data } = await supabase.from("orders").select("*").eq("delivery_status", "requested")').join('const { data } = await supabase.from("orders").select("*, vendors(shop_name, pay_phone)").eq("delivery_status", "requested")');
  r = r.split('const { data } = await supabase.from("orders").select("*").eq("rider_id", rider!.id)').join('const { data } = await supabase.from("orders").select("*, vendors(shop_name, pay_phone)").eq("rider_id", rider!.id)');
}
// Open card: call buyer + call seller
if (!r.includes('Call seller')) {
  r = r.split('              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call</Button>').join('              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call buyer</Button>\n              {o.vendors && o.vendors.pay_phone ? <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.vendors.pay_phone; }}><Phone className="size-4" /> Call seller</Button> : null}');
  r = r.split('              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call</Button>\n            </div>\n          </div>\n        ))}\n      </div>\n      <h2 className="mt-6 font-semibold">Delivery history</h2>').join('              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call buyer</Button>\n              {o.vendors && o.vendors.pay_phone ? <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.vendors.pay_phone; }}><Phone className="size-4" /> Call seller</Button> : null}\n            </div>\n          </div>\n        ))}\n      </div>\n      <h2 className="mt-6 font-semibold">Delivery history</h2>');
}
fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
console.log('Rider: call buyer + call seller on every delivery');

// 2) Add "Ride & earn" nav entry (works for Google or email sign-ins)
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('Ride & earn')) {
  let done = false;
  if (chrome.includes('>Open a shop</Link>')) { chrome = chrome.split('>Open a shop</Link>').join('>Open a shop</Link>\n            <Link to="/rider" className="shrink-0 text-sm font-semibold text-white/90 hover:text-white">Ride & earn</Link>'); done = true; }
  else if (chrome.includes('Open a shop</a>')) { chrome = chrome.split('Open a shop</a>').join('Open a shop</a>\n            <a href="/rider" className="shrink-0 text-sm font-semibold text-white/90 hover:text-white">Ride & earn</a>'); done = true; }
  if (done) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('Nav: Ride & earn added'); }
  else console.log('Nav anchor not found - rider page still reachable at /rider');
}
console.log('DONE');