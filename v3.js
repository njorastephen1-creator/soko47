import fs from 'fs';
const c = fs.readFileSync('src/routes/sell.tsx', 'utf8');
const lines = c.split('\n');

console.log('--- lines mentioning unit ---');
lines.forEach((l, i) => { if (/unit/i.test(l)) console.log((i + 1) + ': ' + l.trim()); });

console.log('\n--- context around Unit (15 lines before, 25 after) ---');
const idx = lines.findIndex((l) => l.includes('Unit') || l.includes('unit'));
if (idx >= 0) {
  console.log(lines.slice(Math.max(0, idx - 15), idx + 25).map((l, j) => (Math.max(0, idx - 15) + j + 1) + ': ' + l).join('\n'));
}