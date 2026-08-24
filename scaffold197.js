import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
c.split('\n').forEach((l, i) => { if (l.includes('Hardware') || l.includes('category') && l.includes('map')) console.log(i, l.trim()); });