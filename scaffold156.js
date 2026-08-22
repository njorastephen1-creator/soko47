import fs from 'fs';

// Vendor subscription -> settings
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('useSettings')) {
  v = v.split('import { formatKes } from "@/lib/cart";').join('import { formatKes } from "@/lib/cart";\nimport { useSettings } from "@/lib/use-settings";');
  v = v.split('  const { vendor, vendors, loading } = useMyVendor();').join('  const { vendor, vendors, loading } = useMyVendor();\n  const settings = useSettings();');
  v = v.split('Starter KSh 499 (100 products) · Pro KSh 999 (unlimited + homepage ads + analytics). Unlocks the second M-Pesa confirms.').join('Starter KSh {Number(settings.starter_price)} ({Number(settings.starter_products)} products) · Pro KSh {Number(settings.pro_price)} (unlimited + homepage ads + analytics).');
  v = v.split('onClick={() => paySubscription(499, "starter")}').join('onClick={() => paySubscription(Number(settings.starter_price), "starter")}');
  v = v.split('{paying ? "Waiting..." : "Starter · KSh 499/mo"}').join('{paying ? "Waiting..." : "Starter · KSh " + Number(settings.starter_price) + "/mo"}');
  v = v.split('onClick={() => paySubscription(999, "pro")}').join('onClick={() => paySubscription(Number(settings.pro_price), "pro")}');
  v = v.split('{paying ? "Waiting..." : "Pro · KSh 999/mo"}').join('{paying ? "Waiting..." : "Pro · KSh " + Number(settings.pro_price) + "/mo"}');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: live pricing');
}

// Rider -> settings
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');
if (!r.includes('useSettings')) {
  r = r.split('import { haversineKm, feeForKm, etaMin } from "@/lib/geo";').join('import { haversineKm, feeForKm, etaMin } from "@/lib/geo";\nimport { useSettings } from "@/lib/use-settings";');
  r = r.split('  const [hPage, setHPage] = useState(0);').join('  const [hPage, setHPage] = useState(0);\n  const settings = useSettings();');
  r = r.split('const earnFor = (o: any) => Math.round(feeFor(o) * 0.9);').join('const earnFor = (o: any) => Math.round(feeFor(o) * (Number(settings.rider_share_pct) / 100));');
  r = r.split('return feeForKm(haversineKm(Number(o.pickup_lat), Number(o.pickup_lng), Number(o.delivery_lat), Number(o.delivery_lng)));').join('return feeForKm(haversineKm(Number(o.pickup_lat), Number(o.pickup_lng), Number(o.delivery_lat), Number(o.delivery_lng)), Number(settings.rider_fee_base), Number(settings.rider_fee_per_km));');
  r = r.split('await stkPush(payPhone.trim(), 300, "RIDER-" + rider.id.slice(0, 8), rider.name, rider.pay_phone || undefined);').join('await stkPush(payPhone.trim(), Number(settings.rider_sub_price), "RIDER-" + rider.id.slice(0, 8), rider.name, rider.pay_phone || undefined);');
  r = r.split('{paying ? "Waiting..." : "Activate - KSh 300/mo"}').join('{paying ? "Waiting..." : "Activate - KSh " + Number(settings.rider_sub_price) + "/mo"}');
  r = r.split('KSh 300/month keeps you active and eligible for deliveries.').join('KSh {Number(settings.rider_sub_price)}/month keeps you active and eligible for deliveries.');
  r = r.split('fare {formatKes(feeForKm(km))} · you earn {formatKes(Math.round(feeForKm(km) * 0.9))}').join('fare {formatKes(feeForKm(km, Number(settings.rider_fee_base), Number(settings.rider_fee_per_km)))} · you earn {formatKes(Math.round(feeForKm(km, Number(settings.rider_fee_base), Number(settings.rider_fee_per_km)) * (Number(settings.rider_share_pct) / 100)))}');
  fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
  console.log('Rider: live pricing');
}

// Social -> settings
let s = fs.readFileSync('src/routes/social.tsx', 'utf8');
if (!s.includes('useSettings')) {
  s = s.split('import { isAdminEmail } from "@/lib/admin";').join('import { isAdminEmail } from "@/lib/admin";\nimport { useSettings } from "@/lib/use-settings";');
  s = s.split('  const isAdm = isAdminEmail(session ? session.user.email : "");').join('  const isAdm = isAdminEmail(session ? session.user.email : "");\n  const settings = useSettings();');
  s = s.split('const d = await stkPush(payPhone.trim(), 100, "SOCIAL-"').join('const d = await stkPush(payPhone.trim(), Number(settings.social_price), "SOCIAL-"');
  s = s.split('Activate - KSh 100/week').join('Activate - KSh {Number(settings.social_price)}/week');
  s = s.split('KSh 100/week to post.').join('KSh {Number(settings.social_price)}/week to post.');
  s = s.split('const d = await stkPush(payPhone.trim() || "254700000000", 50, "BOOST-"').join('const d = await stkPush(payPhone.trim() || "254700000000", Number(settings.boost_price), "BOOST-"');
  s = s.split('Boost KSh 50').join('Boost KSh {Number(settings.boost_price)}');
  fs.writeFileSync('src/routes/social.tsx', s);
  console.log('Social: live pricing');
}
console.log('DONE');