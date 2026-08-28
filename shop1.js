import fs from 'fs';
const c = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8');
const lines = c.split('\n');

console.log('--- lines mentioning limit or products ---');
lines.forEach((l, i) => { 
  if (/limit|products|useQuery/i.test(l)) {
    console.log((i + 1) + ': ' + l.trim());
  }
});

console.log('\n--- product grid rendering ---');
const idx = lines.findIndex((l) => l.includes('<ProductCard'));
if (idx >= 0) {
  console.log(lines.slice(Math.max(0, idx - 5), idx + 10).map((l, j) => (Math.max(0, idx - 5) + j + 1) + ': ' + l).join('\n'));
}