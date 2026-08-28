import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
const lines = c.split('\n');

console.log('--- unit state lines ---');
lines.forEach((l, i) => { if (/setUnit|\[unit,/.test(l)) console.log((i + 1) + ': ' + l.trim()); });

console.log('\n--- Unit label + chips JSX ---');
const idx = lines.findIndex((l) => l.includes('>Unit<'));
if (idx >= 0) {
  console.log(lines.slice(Math.max(0, idx - 3), idx + 15).map((l, j) => (Math.max(0, idx - 3) + j + 1) + ': ' + l).join('\n'));
}