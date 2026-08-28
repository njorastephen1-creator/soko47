import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
const lines = c.split('\n');

console.log('--- markStatus function (first 15 lines) ---');
const idx = lines.findIndex((l) => l.includes('const markStatus'));
if (idx >= 0) {
  console.log(lines.slice(idx, idx + 15).map((l, j) => (idx + j + 1) + ': ' + l).join('\n'));
}