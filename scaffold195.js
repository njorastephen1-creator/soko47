import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
c.split('\n').forEach((l, i) => { if (l.includes('ordSlice') || l.includes('ordPages') || l.includes('orderGroups')) console.log(i, l.trim()); });
const p = c.indexOf('ordPages > 0');
console.log('--- pager ---');
console.log(c.slice(p, p + 500));