import fs from 'fs';
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');

// Registration copy
r = r.split('Deliver orders, earn KSh 135 per drop (platform keeps KSh 15). Paid straight to your M-Pesa.').join('Earn per delivery based on distance - base KSh 100 + KSh 50/km. You keep 90%, the platform keeps 10%. Paid straight to your M-Pesa.');

// Dynamic fare helpers
if (!r.includes('const earnFor')) {
  r = r.split('  const active = (mine || []).filter((o: any) => o.delivery_status === "accepted");').join(`  const feeFor = (o: any) => {
    if (o.delivery_fee_kes) return Number(o.delivery_fee_kes);
    if (o.pickup_lat != null && o.pickup_lng != null && o.delivery_lat != null && o.delivery_lng != null) return feeForKm(haversineKm(Number(o.pickup_lat), Number(o.pickup_lng), Number(o.delivery_lat), Number(o.delivery_lng)));
    return 150;
  };
  const earnFor = (o: any) => Math.round(feeFor(o) * 0.9);
  const active = (mine || []).filter((o: any) => o.delivery_status === "accepted");`);
}
r = r.split('const earnings = done.length * 135;').join('const earnings = done.reduce((s: number, o: any) => s + earnFor(o), 0);');

// Labels & headings
r = r.split('<p className="text-xs text-muted-foreground">Earned (KSh 135/drop)</p>').join('<p className="text-xs text-muted-foreground">Earned (90% of fare)</p>');
r = r.split('<h2 className="mt-6 font-semibold">Open deliveries (KSh 150 fee)</h2>').join('<h2 className="mt-6 font-semibold">Open deliveries (fare by distance)</h2>');
r = r.split('toast.success("Delivered! KSh 135 earned.");').join('toast.success("Delivered! Your 90% fare is on the way to your M-Pesa.");');
r = r.split('<span className="font-semibold text-success">+{formatKes(135)}</span>').join('<span className="font-semibold text-success">+{formatKes(earnFor(o))}</span>');

// Open card: show rider's share of the fare
r = r.split('return <p className="mt-1 text-xs font-semibold text-accent-deep">{km.toFixed(1)} km away · ~{etaMin(km)} min · fare {formatKes(feeForKm(km))}</p>;').join('return <p className="mt-1 text-xs font-semibold text-accent-deep">{km.toFixed(1)} km · ~{etaMin(km)} min · fare {formatKes(feeForKm(km))} · you earn {formatKes(Math.round(feeForKm(km) * 0.9))}</p>;');

fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
console.log('DONE: distance-based rider fares');