import fs from 'fs';
import path from 'path';

// 1) add pickVendor helper to my-vendor.ts
const mv = 'src/lib/my-vendor.ts';
let m = fs.readFileSync(mv, 'utf8');
if (!m.includes('export async function pickVendor')) {
  m += `\nexport async function pickVendor(userId: string) {\n  const { data: prof } = await supabase.from("user_profiles").select("active_vendor_id").eq("user_id", userId).maybeSingle();\n  const { data: list } = await supabase.from("vendors").select("*").eq("user_id", userId);\n  const arr = list || [];\n  return arr.find((v: any) => v.id === (prof ? (prof as any).active_vendor_id : null)) || arr[0] || null;\n}\n`;
  fs.writeFileSync(mv, m);
  console.log('my-vendor: pickVendor added');
}

// 2) replace user_id maybeSingle lookups with pickVendor
const re = /const \{ data \} = await supabase\.from\("vendors"\)\.select\("[^"]*"\)\.eq\("user_id", ([^)]+?)\)\.maybeSingle\(\);/g;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f) || f.includes('my-vendor')) continue;
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.replace(re, (mm, expr) => 'const data = await pickVendor(' + expr.trim() + ');');
  if (c !== before) {
    if (!c.includes('import { pickVendor }')) {
      c = c.split('from "@/integrations/supabase/client";').join('from "@/integrations/supabase/client";\nimport { pickVendor } from "@/lib/my-vendor";');
    }
    fs.writeFileSync(f, c);
    console.log('fixed', f);
  }
}
console.log('DONE');