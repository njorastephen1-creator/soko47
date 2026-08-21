import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('"}>>').join('"}>');
fs.writeFileSync(f, c);
console.log('FIXED: double brace removed');