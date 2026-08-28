import fs from 'fs';
let c = fs.readFileSync('api/og.js', 'utf8');

// Replace the broken env-var fallback chain with the correct hardcoded key
const OLD_BASE = 'const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";';
const OLD_ANON = 'const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";';
const NEW_BASE = 'const base = process.env.SUPABASE_URL || "https://khonaidacpdeyptxenkl.supabase.co";';
const NEW_ANON = 'const anon = process.env.SUPABASE_ANON_KEY || "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";';

if (!c.includes(OLD_BASE) || !c.includes(OLD_ANON)) { console.log('anchors not found'); process.exit(1); }
c = c.split(OLD_BASE).join(NEW_BASE).split(OLD_ANON).join(NEW_ANON);
fs.writeFileSync('api/og.js', c);
console.log('og.js now uses the correct Supabase key');