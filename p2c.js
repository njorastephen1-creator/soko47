import fs from 'fs';
import path from 'path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const candidates = [];
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const base = path.basename(f).toLowerCase();
  if (/checkout|cart|order|pay/.test(base)) {
    candidates.push(f);
  }
}
console.log('=== candidate files ===');
candidates.forEach(f => console.log(f));

// also search for order insert code
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('from("orders").insert') || c.includes('from("order_items").insert')) {
    console.log('ORDER INSERT found in:', f);
  }
}