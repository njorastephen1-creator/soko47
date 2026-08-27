import fs from 'fs';

// Remove the broken middleware + TS function
try { fs.unlinkSync('api/_middleware.ts'); console.log('removed _middleware.ts'); } catch {}
try { fs.unlinkSync('api/og/[id].ts'); console.log('removed og/[id].ts'); } catch {}

// Plain-JS OG endpoint (no SDK, no @vercel/node) using fetch + anon key
fs.writeFileSync('api/og/[id].js', `const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default async function handler(req, res) {
  const id = req.query.id;
  const base = process.env.SUPABASE_URL || "";
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  const productUrl = "https://soko47-kenya.vercel.app/product/" + id;

  if (!base || !anon || !id) { res.setHeader("Location", productUrl); return res.status(302).end(); }

  try {
    const q = base + "/rest/v1/products?id=eq." + encodeURIComponent(id) + "&select=title,price_kes,offer_price_kes,image_url,vendors(shop_name,market_name,county_slug)";
    const r = await fetch(q, { headers: { apikey: anon, Authorization: "Bearer " + anon } });
    const rows = await r.json();
    const p = rows && rows[0];
    if (!p) { res.setHeader("Location", productUrl); return res.status(302).end(); }

    const price = Number(p.offer_price_kes) > 0 ? Number(p.offer_price_kes) : Number(p.price_kes);
    const title = esc(p.title + " \\u00b7 KSh " + price.toLocaleString() + " | Soko47");
    const v = p.vendors || {};
    const description = esc(p.title + " for sale at " + (v.shop_name || "a trader") + " in " + (v.market_name || "") + ". Buy directly from the trader on Soko47.");
    const image = p.image_url || "";

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(
      "<!DOCTYPE html><html><head>" +
      "<title>" + title + "</title>" +
      '<meta property="og:title" content="' + title + '" />' +
      '<meta property="og:description" content="' + description + '" />' +
      (image ? '<meta property="og:image" content="' + esc(image) + '" />' : "") +
      '<meta property="og:url" content="' + esc(productUrl) + '" />' +
      '<meta property="og:type" content="product" />' +
      '<meta property="og:site_name" content="Soko47" />' +
      '<meta name="twitter:card" content="summary_large_image" />' +
      '<script>window.location.href="' + esc(productUrl) + '";</script>' +
      "</head><body>Redirecting...</body></html>"
    );
  } catch (e) {
    res.setHeader("Location", productUrl);
    return res.status(302).end();
  }
}
`);
console.log('api/og/[id].js created');

// vercel.json: route ONLY social bots to the OG endpoint; humans get the SPA
fs.writeFileSync('vercel.json', `{
  "rewrites": [
    {
      "source": "/product/:id",
      "has": [
        { "type": "header", "key": "user-agent", "value": ".*(WhatsApp|whatsapp|facebookexternalhit|Facebot|facebot|Twitterbot|twitterbot|LinkedInBot|linkedinbot|TelegramBot|telegrambot|Slackbot|slackbot|Discordbot|discordbot).*" }
      ],
      "destination": "/api/og/:id"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
`);
console.log('vercel.json fixed (bots only)');