import fs from 'fs';
import path from 'path';
// raise clip cap to 48MB
const v = 'src/components/video-upload.tsx';
let c = fs.readFileSync(v, 'utf8');
c = c.split('const MAX = 45 * 1024 * 1024;').join('const MAX = 48 * 1024 * 1024;');
c = c.split('more than 45MB till further notice').join('more than 48MB till further notice');
c = c.split('Clips up to 45MB upload instantly').join('Clips up to 48MB upload instantly');
fs.writeFileSync(v, c);
console.log('cap -> 48MB');

// print category arrays
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes('Repair & Construction')) {
    console.log('=== ' + f + ' ===');
    t.split('\n').forEach((l, i) => { if (l.includes('Fresh Produce') || l.includes('Repair & Construction') || l.includes('categories') || l.includes('Category')) console.log(i, l.trim()); });
  }
}