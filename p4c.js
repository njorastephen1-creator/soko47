import fs from 'fs';
const f = 'src/routes/shop.$slug.tsx';
let c = fs.readFileSync(f, 'utf8');
const OLD = '.eq("vendor_id", shop!.id).order("created_at", { ascending: false });';
const NEW = '.eq("vendor_id", shop!.id).order("created_at", { ascending: false }).limit(60);';
if (c.includes(OLD)) { c = c.split(OLD).join(NEW); fs.writeFileSync(f, c); console.log('shop page: capped at 60'); }
else console.log('already capped or pattern differs');