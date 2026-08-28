import fs from 'fs';
let c = fs.readFileSync('api/og.js', 'utf8');

const ANCHOR = 'if (req.query.debug === "1") {';
if (!c.includes(ANCHOR)) { console.log('anchor not found'); process.exit(1); }

const DEBUG = ANCHOR + `
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({
      hasUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasAnon: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
      id: req.query.id || null,
      ua: req.headers["user-agent"] || "no-ua",
      isBot: /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/.test((req.headers["user-agent"] || "").toLowerCase())
    }));`;

c = c.split(ANCHOR).join(DEBUG);
fs.writeFileSync('api/og.js', c);
console.log('debug enhanced: shows id, ua, isBot');