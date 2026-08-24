import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
const i = c.indexOf('Your products');
const j = c.indexOf('Delivery pickup point');
console.log('--- CARD ---');
console.log(c.slice(i, j > i ? j : i + 3000));
console.log('--- STATES ---');
c.split('\n').forEach((l, idx) => { if (l.includes('useState')) console.log(idx, l.trim()); });