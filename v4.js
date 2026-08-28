import fs from 'fs';
import path from 'path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (/\.(tsx|ts)$/.test(e.name)) return [p];
    return [];
  });
}

const files = walk('src');
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('kiondo')) {
    console.log('FOUND in:', f);
    const lines = c.split('\n');
    const idx = lines.findIndex((l) => l.includes('kiondo'));
    console.log(lines.slice(Math.max(0, idx - 12), idx + 18).map((l, j) => (Math.max(0, idx - 12) + j + 1) + ': ' + l).join('\n'));
  }
}