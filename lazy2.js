import fs from 'fs';
let c = fs.readFileSync('src/components/product-card.tsx', 'utf8');

// Add React import for useState
if (!c.includes('useState')) {
  c = c.split('import { Link } from "@tanstack/react-router";').join('import { useState } from "react";\nimport { Link } from "@tanstack/react-router";');
  console.log('added useState import');
}

// Replace the image tag with lazy loading + fade-in
const OLD_IMG = '{product.image_url ? <img src={product.image_url} alt={product.title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <Package className="m-auto size-8 text-muted-foreground" />}';

const NEW_IMG = `{product.image_url ? <LazyImage src={product.image_url} alt={product.title} /> : <Package className="m-auto size-8 text-muted-foreground" />}`;

if (!c.includes(OLD_IMG)) { console.log('image tag not found'); process.exit(1); }
c = c.split(OLD_IMG).join(NEW_IMG);
console.log('replaced image with LazyImage component');

// Add LazyImage component before ProductCard
const LAZY_COMPONENT = `
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={\`size-full object-cover transition-all duration-300 \${loaded ? "opacity-100 group-hover:scale-105" : "opacity-0"}\`}
    />
  );
}

`;

const INSERT_POINT = 'export function ProductCard({ product }: { product: ProductRow }) {';
if (!c.includes(INSERT_POINT)) { console.log('insert point not found'); process.exit(1); }
c = c.split(INSERT_POINT).join(LAZY_COMPONENT + INSERT_POINT);
console.log('added LazyImage component');

fs.writeFileSync('src/components/product-card.tsx', c);
console.log('\nproduct-card.tsx updated with lazy loading');