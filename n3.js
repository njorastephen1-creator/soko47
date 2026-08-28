import fs from 'fs';

const v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
const lines = v.split('\n');

console.log('--- markStatus calls (statuses used) ---');
lines.forEach((l, i) => { if (l.includes('markStatus(')) console.log((i + 1) + ': ' + l.trim()); });

console.log('\n--- incoming orders query ---');
lines.forEach((l, i) => { if (l.includes('"order_items"') || l.includes('incoming')) console.log((i + 1) + ': ' + l.trim()); });

console.log('\n--- checkout.tsx order insert fields ---');
const c = fs.readFileSync('src/routes/checkout.tsx', 'utf8');
c.split('\n').forEach((l, i) => { if (/buyer|user_id|insert/i.test(l)) console.log((i + 1) + ': ' + l.trim()); });