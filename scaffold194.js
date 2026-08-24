import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
const i = c.indexOf('Incoming orders');
console.log(c.slice(i, i + 3500));