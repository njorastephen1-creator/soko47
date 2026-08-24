import fs from 'fs';
import path from 'path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk('src')) {
  if (!/\.tsx$/.test(f)) continue;
  const base = path.basename(f);
  if (/enrich|product/.test(base)) {
    const t = fs.readFileSync(f, 'utf8');
    console.log('===== ' + f + ' =====');
    t.split('\n').forEach((l, i) => { if (/gallery|video|Video|image_url|Upload/.test(l)) console.log(i, l.trim().slice(0, 160)); });
  }
}
const v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
console.log('===== vendor form (Unit/Stock/Condition) =====');
v.split('\n').forEach((l, i) => { if (/Unit|Stock|Condition|np\.unit|np\.stock/.test(l)) console.log(i, l.trim().slice(0, 160)); });