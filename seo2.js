import fs from 'fs';

// 1) useSeo hook
fs.writeFileSync('src/lib/seo.ts', `import { useEffect } from "react";
export function useSeo(opts: { title?: string; description?: string; image?: string; url?: string; type?: string }) {
  const { title, description, image, url, type } = opts;
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector('meta[' + attr + '="' + key + '"]') as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    if (description) { setMeta("name", "description", description); setMeta("property", "og:description", description); }
    if (title) setMeta("property", "og:title", title);
    if (image) setMeta("property", "og:image", image);
    if (url) setMeta("property", "og:url", url);
    setMeta("property", "og:type", type || "website");
    setMeta("property", "og:site_name", "Soko47");
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  }, [title, description, image, url, type]);
}
`);
console.log('seo.ts created');

// 2) Wire into product page BEFORE the early return (hooks rule)
const f = 'src/routes/product.$id.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('useSeo')) {
  c = c.split('import { ProductCard } from "@/components/product-card";').join('import { ProductCard } from "@/components/product-card";\nimport { useSeo } from "@/lib/seo";');
  const ANCHOR = '  if (!product) return <p className="py-16 text-center text-muted-foreground">Loading product...</p>;';
  const SEO = `  useSeo(product ? {
    title: product.title + " \\u00b7 " + formatKes(Number(product.offer_price_kes) > 0 ? Number(product.offer_price_kes) : Number(product.price_kes)) + " | Soko47",
    description: product.title + " for sale at " + product.vendors.shop_name + ", " + product.vendors.market_name + (getCounty(product.vendors.county_slug) ? " \\u00b7 " + getCounty(product.vendors.county_slug)!.county : "") + ". Buy directly from the trader on Soko47.",
    image: product.image_url || undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    type: "product",
  } : { title: "Soko47 \\u2013 Kenya's great markets, online" });
` + ANCHOR;
  if (c.includes(ANCHOR)) { c = c.split(ANCHOR).join(SEO); console.log('product page: useSeo wired'); }
  else console.log('ANCHOR not found');
  fs.writeFileSync(f, c);
}

// 3) Print current config for Layer 2
console.log('\n===== vercel.json =====');
console.log(fs.existsSync('vercel.json') ? fs.readFileSync('vercel.json', 'utf8') : '(does not exist)');
console.log('\n===== index.html (head) =====');
const html = fs.readFileSync('index.html', 'utf8');
console.log(html.slice(0, html.indexOf('</head>') + 8));