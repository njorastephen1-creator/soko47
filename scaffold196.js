import fs from 'fs';
import path from 'path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0;
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  let c = fs.readFileSync(f, 'utf8');
  const o = c;
  c = c.split('Category (10 like Jiji)').join('Category');
  c = c.split('(10 like Jiji)').join('');
  c = c.split('like Jiji').join('');
  if (c !== o) { fs.writeFileSync(f, c); n++; console.log('cleaned', f); }
}
console.log(n ? 'DONE' : 'no matches');