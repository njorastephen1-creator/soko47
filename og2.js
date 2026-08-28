import fs from 'fs';

fs.writeFileSync('api/og.js', `const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE = "https://soko47-kenya.vercel.app";
const BASE = "https://khonaidacpdeyptxenkl.supabase.co";
const ANON = "sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa";
const BOT_RE = /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider/;

async function fetchJson(path) {
  const r = await fetch(BASE + path, { headers: { apikey: ANON, Authorization: "Bearer " + ANON, Prefer: "count=exact" } });
  const rows = await r.json();
  const range = r.headers.get("content-range") || "";
  const total = range.indexOf("/") >= 0 ? parseInt(range.split("/")[1], 10) : null;
  return { rows: Array.isArray(rows) ? rows : [], total: total };
}

function ogHtml(title, description, image, url) {
  return "<!DOCTYPE html><html><head>" +
    "<title>" + title + "</title>" +
    '<meta property="og:title" content="' + title + '" />' +
    '<meta property="og:description" content="' + description + '" />' +
    (image ? '<meta property="og:image" content="' + esc(image) + '" />' : "") +
    '<meta property="og:url" content="' + esc(url) + '" />' +
    '<meta property="og:type" content="website" />' +
    '<meta property="og:site_name" content="Soko47" />' +
    '<meta name="twitter:card" content="summary_large_image" />' +
    '<script>window.location.href="' + esc(url) + '";</script>' +
    "</head><body>Redirecting...</body></html>";
}

function titleCase(s) {
  return String(s || "").replace(/-/g, " ").replace(/\\b\\w/g, function (m) { return m.toUpperCase(); });
}

export default async function handler(req, res) {
  const type = req.query.type || "product";
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const isBot = BOT_RE.test(ua);

  // Humans get the SPA so the app opens at the correct URL
  if (!isBot) {
    try {
      const r = await fetch(SITE + "/");
      const html = await r.text();
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    } catch (e) {
      res.setHeader("Location", "/");
      return res.status(302).end();
    }
  }

  try {
    if (type === "shop") {
      const slug = req.query.slug || "";
      const v = await fetchJson("/rest/v1/vendors?slug=eq." + encodeURIComponent(slug) + "&select=id,shop_name,market_name,county_slug,rating_sum,rating_count&limit=1");
      const vendor = v.rows[0];
      if (!vendor) { res.setHeader("Location", SITE + "/"); return res.status(302).end(); }
      const p = await fetchJson("/rest/v1/products?vendor_id=eq." + vendor.id + "&select=title,image_url&order=created_at.desc&limit=4");
      const count = p.total != null ? p.total : p.rows.length;
      const rating = vendor.rating_count > 0 ? (vendor.rating_sum / vendor.rating_count).toFixed(1) : null;
      const title = esc(vendor.shop_name + " - " + (vendor.market_name || titleCase(vendor.county_slug)) + " | Soko47");
      const description = esc(count + " products for sale at " + vendor.shop_name + " in " + (vendor.market_name || "") + (rating ? ". Rated " + rating + " stars" : "") + ". Shop directly from the trader on Soko47.");
      const image = p.rows[0] ? p.rows[0].image_url : "";
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
      return res.status(200).send(ogHtml(title, description, image, SITE + "/shop/" + slug));
    }

    if (type === "county") {
      const county = req.query.county || "";
      const p = await fetchJson("/rest/v1/products?select=title,image_url,vendors!inner(county_slug)&vendors.county_slug=eq." + encodeURIComponent(county) + "&order=created_at.desc&limit=4");
      const count = p.total != null ? p.total : p.rows.length;
      const name = titleCase(county);
      const title = esc(name + " Market - Buy from local traders | Soko47");
      const description = esc(count + " products from traders across " + name + ". Fresh produce, fashion, electronics and more - buy directly on Soko47.");
      const image = p.rows[0] ? p.rows[0].image_url : "";
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
      return res.status(200).send(ogHtml(title, description, image, SITE + "/markets/" + county));
    }

    // product (default)
    const id = req.query.id || "";
    const p = await fetchJson("/rest/v1/products?id=eq." + encodeURIComponent(id) + "&select=title,price_kes,offer_price_kes,image_url,vendors(shop_name,market_name)&limit=1");
    const prod = p.rows[0];
    if (!prod) { res.setHeader("Location", SITE + "/product/" + id); return res.status(302).end(); }
    const price = Number(prod.offer_price_kes) > 0 ? Number(prod.offer_price_kes) : Number(prod.price_kes);
    const v = prod.vendors || {};
    const title = esc(prod.title + " \\u00b7 KSh " + price.toLocaleString() + " | Soko47");
    const description = esc(prod.title + " for sale at " + (v.shop_name || "a trader") + " in " + (v.market_name || "") + ". Buy directly from the trader on Soko47.");
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(ogHtml(title, description, prod.image_url || "", SITE + "/product/" + id));
  } catch (e) {
    res.setHeader("Location", SITE + "/");
    return res.status(302).end();
  }
}
`);
console.log('api/og.js: supports product + shop + county, humans get SPA');

fs.writeFileSync('vercel.json', `{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/product/:id", "destination": "/api/og?type=product&id=:id" },
    { "source": "/shop/:slug", "destination": "/api/og?type=shop&slug=:slug" },
    { "source": "/markets/:county", "destination": "/api/og?type=county&county=:county" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
`);
console.log('vercel.json: shop + county routes now OG-rendered');