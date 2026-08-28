const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default async function handler(req, res) {
  try {
    const id = req.query.id;
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const isBot = /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/.test(ua);

    const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

    if (req.query.debug === "1") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({
      hasUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasAnon: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
      baseValue: base,
      anonValue: anon,
      idValue: id,
      ua: req.headers["user-agent"] || "no-ua",
      isBot: /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/.test((req.headers["user-agent"] || "").toLowerCase())
    }));
      const names = Object.keys(process.env).filter((k) => /supabase/i.test(k));
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(JSON.stringify({ hasUrl: !!base, hasAnon: !!anon, hasId: !!id, isBot: isBot, supabaseVars: names }));
    }

    if (!isBot) {
      res.setHeader("Location", "/");
      return res.status(302).end();
    }

    const productUrl = "https://soko47-kenya.vercel.app/product/" + id;

    if (!base || !anon || !id) {
      res.setHeader("Location", productUrl);
      return res.status(302).end();
    }

    const q = base + "/rest/v1/products?id=eq." + encodeURIComponent(id) + "&select=title,price_kes,offer_price_kes,image_url,vendors(shop_name,market_name,county_slug)";
    const r = await fetch(q, { headers: { apikey: anon, Authorization: "Bearer " + anon } });
    const rows = await r.json();
    const p = rows && rows[0];
    if (!p) {
      res.setHeader("Location", productUrl);
      return res.status(302).end();
    }

    const price = Number(p.offer_price_kes) > 0 ? Number(p.offer_price_kes) : Number(p.price_kes);
    const title = esc(p.title + " \u00b7 KSh " + price.toLocaleString() + " | Soko47");
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
    res.setHeader("Content-Type", "application/json");
    return res.status(500).send(JSON.stringify({ error: e.message, stack: e.stack }));
  }
}
