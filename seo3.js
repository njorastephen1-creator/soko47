import fs from 'fs';
import path from 'path';

// Create the directory if it doesn't exist
const ogDir = 'api/og';
if (!fs.existsSync(ogDir)) {
  fs.mkdirSync(ogDir, { recursive: true });
  console.log('created', ogDir);
}

fs.writeFileSync(path.join(ogDir, '[id].ts'), `import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).send("Invalid ID");

  const { data: product, error } = await supabase
    .from("products")
    .select("*, vendors!inner(shop_name, slug, county_slug, market_name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) return res.status(404).send("Product not found");

  const price = Number(product.offer_price_kes) > 0 ? Number(product.offer_price_kes) : Number(product.price_kes);
  const priceStr = "KSh " + price.toLocaleString();
  const county = product.vendors?.county_slug ? product.vendors.county_slug.replace(/-/g, " ") : "";
  const title = product.title + " · " + priceStr + " | Soko47";
  const description = product.title + " for sale at " + (product.vendors?.shop_name || "a trader") + " in " + (product.vendors?.market_name || "") + (county ? ", " + county : "") + ". Buy directly from the trader on Soko47.";
  const image = product.image_url || "https://soko47.co.ke/og-default.png";
  const url = "https://soko47.co.ke/product/" + id;

  const html = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>\${title}</title>
  <meta property="og:title" content="\${title}" />
  <meta property="og:description" content="\${description}" />
  <meta property="og:image" content="\${image}" />
  <meta property="og:url" content="\${url}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Soko47" />
  <meta name="twitter:card" content="summary_large_image" />
  <script>window.location.href = "\${url}";</script>
</head>
<body>Redirecting...</body>
</html>\`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.send(html);
}
`);
console.log('api/og/[id].ts created');