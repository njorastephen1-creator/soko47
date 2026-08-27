import fs from 'fs';
const f = 'src/lib/use-is-admin.ts';
let c = fs.readFileSync(f, 'utf8');
const OLD = 'return !!(data || []).find((a: any) => a.email === email);';
const NEW = 'return !!(data || []).find((a: any) => a.email.toLowerCase() === (email || "").toLowerCase());';
if (c.includes(OLD)) {
  c = c.split(OLD).join(NEW);
  fs.writeFileSync(f, c);
  console.log('DONE: case-insensitive admin check');
} else console.log('already patched');