import fs from 'fs';
let c = fs.readFileSync('api/og.js', 'utf8');

const ANCHOR = 'if (req.query.debug === "1") {';
const OLD_DEBUG = ANCHOR + `
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({
      hasUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasAnon: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
      id: req.query.id || null,
      ua: req.headers["user-agent"] || "no-ua",
      isBot: /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/.test((req.headers["user-agent"] || "").toLowerCase())
    }));`;

const NEW_DEBUG = ANCHOR + `
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({
      hasUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasAnon: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
      baseValue: base,
      anonValue: anon,
      idValue: id,
      ua: req.headers["user-agent"] || "no-ua",
      isBot: /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/.test((req.headers["user-agent"] || "").toLowerCase())
    }));`;

if (!c.includes(OLD_DEBUG)) { console.log('old debug not found'); process.exit(1); }
c = c.split(OLD_DEBUG).join(NEW_DEBUG);
fs.writeFileSync('api/og.js', c);
console.log('debug now shows actual runtime values');