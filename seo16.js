import fs from 'fs';

let c = fs.readFileSync('api/og.js', 'utf8');

// Insert a debug branch right after the anon/base declarations
const ANCHOR = 'const anon = process.env.SUPABASE_ANON_KEY || "";';
if (!c.includes(ANCHOR)) { console.log('anchor not found - check file'); process.exit(1); }

const DEBUG = ANCHOR + `

  if (req.query.debug === "1") {
    const names = Object.keys(process.env).filter((k) => /supabase/i.test(k));
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({ hasUrl: !!base, hasAnon: !!anon, hasId: !!id, supabaseVars: names }));
  }`;

c = c.split(ANCHOR).join(DEBUG);
fs.writeFileSync('api/og.js', c);
console.log('debug branch added to api/og.js');