import fs from 'fs';
fs.writeFileSync('src/components/vendor-bar.tsx', `import { Link } from "@tanstack/react-router";
import { useMyVendor } from "@/lib/my-vendor";
export function VendorBar() {
  const { vendor } = useMyVendor();
  if (!vendor) return null;
  return (
    <div className="bg-primary">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs font-semibold">
        <span className="shrink-0 text-white/70">Seller tools:</span>
        <Link to="/vendor" className="shrink-0 cursor-pointer rounded-full bg-white px-3 py-1 text-primary">Shop dashboard</Link>
        <Link to="/pos" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">POS & Receipts</Link>
        <Link to="/chats" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">Customer chats</Link>
        <Link to="/profile" className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25">My profile</Link>
        {vendor.subscription_plan === "pro" ? <Link to="/pro" className="shrink-0 cursor-pointer rounded-full bg-accent px-3 py-1 text-white">Pro Studio</Link> : null}
      </div>
    </div>
  );
}
`);
console.log('Seller bar: high contrast, clearly clickable');
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
const before1 = v;
v = v.replace(/<Button asChild[^>]*><Link to="\/sell"[^>]*>Add product<\/Link><\/Button>/, '<Button size="sm" onClick={() => { const el = document.getElementById("add-product-form"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Add product</Button>');
if (v !== before1) n++;
if (!v.includes('id="add-product-form"')) {
  v = v.split('<div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">Add a product</h2>').join('<div id="add-product-form" className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">Add a product</h2>');
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
console.log('Vendor add-product scroll:', n);
let card = fs.readFileSync('src/components/product-card.tsx', 'utf8');
if (!card.includes('aspect-[4/3]')) {
  card = card.split('aspect-square w-full overflow-hidden bg-secondary').join('aspect-[4/3] w-full overflow-hidden bg-secondary');
  card = card.split('{product.description ? <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{product.description}</p> : null}').join('{product.description ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{product.description}</p> : null}');
  card = card.split(/text-\[9px\] font-medium/g).join('text-[11px] font-medium');
  card = card.split('mt-1 flex items-center gap-0.5 text-[10px] text-muted-foreground').join('mt-1 flex items-center gap-0.5 text-[11px] text-muted-foreground');
  fs.writeFileSync('src/components/product-card.tsx', card);
  console.log('Cards: smaller image, bigger richer info');
}
console.log('DONE');