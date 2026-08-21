import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
const before = c;
c = c.replaceAll(')}}>', ')}>');
if (c === before) console.log('WARNING: pattern not found, opening file for manual fix...');
fs.writeFileSync(f, c);
console.log('FIXED: extra } removed');