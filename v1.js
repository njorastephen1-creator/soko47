import fs from 'fs';
const c = fs.readFileSync('src/routes/vendor.tsx', 'utf8');
const lines = c.split('\n');

console.log('--- lines mentioning unit ---');
lines.forEach((l, i) => { if (/unit/i.test(l)) console.log((i + 1) + ': ' + l.trim()); });

console.log('\n--- context around the Unit label ---');
const idx = lines.findIndex((l) => l.includes('Unit'));
if (idx >= 0) {
  console.log(lines.slice(Math.max(0, idx - 8), idx + 20).map((l, j) => (Math.max(0, idx - 8) + j + 1) + ': ' + l).join('\n'));
}

console.log('\n--- useState lines ---');
lines.forEach((l, i) => { if (l.includes('useState')) console.log((i + 1) + ': ' + l.trim()); });