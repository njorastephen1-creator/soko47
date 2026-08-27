import fs from 'fs';
import path from 'path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes('from("vendors")')) {
    console.log('===== ' + f + ' =====');
    const lines = t.split('\n');
    lines.forEach((l, i) => { if (l.includes('vendors')) { console.log(i, lines.slice(i, i + 3).map(x => x.trim()).join(' | ').slice(0, 300)); } });
  }
}