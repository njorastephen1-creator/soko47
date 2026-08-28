import fs from 'fs';

console.log('=== notifications-bell.tsx ===');
console.log(fs.readFileSync('src/components/notifications-bell.tsx', 'utf8'));

console.log('\n=== vendor.tsx order update context (lines 150-180) ===');
const v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8').split('\n');
console.log(v.slice(149, 180).map((l, i) => (150 + i) + ': ' + l).join('\n'));