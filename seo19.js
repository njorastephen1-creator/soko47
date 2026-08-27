import fs from 'fs';
let c = fs.readFileSync('api/og.js', 'utf8');

const OLD_BASE = 'const base = process.env.SUPABASE_URL || "";';
const OLD_ANON = 'const anon = process.env.SUPABASE_ANON_KEY || "";';
const NEW_BASE = 'const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";';
const NEW_ANON = 'const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";';

if (!c.includes(OLD_BASE) || !c.includes(OLD_ANON)) { console.log('anchors not found'); process.exit(1); }
c = c.split(OLD_BASE).join(NEW_BASE).split(OLD_ANON).join(NEW_ANON);
fs.writeFileSync('api/og.js', c);
console.log('og.js now reads VITE_ env vars as fallback');