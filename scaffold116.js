import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('Or paste photo link')) {
  v = v.split('const [np, setNp] = useState<any>({ title: "", price: "", stock: "", category: "produce", unit: "piece", image: "", desc: "" });').join('const [np, setNp] = useState<any>({ title: "", price: "", offer: "", stock: "", category: "produce", unit: "piece", condition: "brand new", image: "", imageUrl: "", brand: "", desc: "" });');
  v = v.split('const { error } = await supabase.from("products").insert({ vendor_id: vendor.id, title: np.title.trim(), price_kes: price, stock: Number(np.stock) || 0, category_slug: np.category, unit: np.unit || "piece", image_url: np.image || null, description: np.desc.trim() || null, is_active: true });').join('const { error } = await supabase.from("products").insert({ vendor_id: vendor.id, title: np.title.trim(), price_kes: price, stock: Number(np.stock) || 0, category_slug: np.category, unit: np.unit || "piece", condition: np.condition, brand: np.brand.trim() || null, offer_price_kes: Number(np.offer) > 0 ? Number(np.offer) : null, image_url: np.image || np.imageUrl.trim() || null, description: np.desc.trim() || null, is_active: true });');
  const s = v.indexOf('      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">➕ Add a product</h2>');
  const eStr = '        <Button className="mt-3" onClick={addProduct}>Put on the market</Button>\n      </div>';
  const e = v.indexOf(eStr);
  if (s >= 0 && e >= 0) {
    const NEWCARD = `      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">➕ Add a product</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label>Product name</Label><Input value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} placeholder="e.g. Fresh tomatoes (kiondo)" /></div>
          <div><Label>Price (KSh)</Label><Input type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="250" /></div>
          <div><Label>Offer price (optional)</Label><Input type="number" value={np.offer} onChange={(e) => setNp({ ...np, offer: e.target.value })} placeholder="Original stays crossed out" /></div>
          <div><Label>Stock</Label><Input type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} placeholder="40" /></div>
          <div><Label>Condition</Label>
            <div className="mt-1 flex gap-2">
              {["brand new", "used"].map((cd) => (<button key={cd} type="button" onClick={() => setNp({ ...np, condition: cd })} className={"rounded-full px-3 py-1.5 text-xs font-semibold capitalize " + (np.condition === cd ? "bg-primary text-primary-foreground" : "bg-secondary")}>{cd}</button>))}
            </div>
          </div>
          <div><Label>Unit</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {["piece", "kg", "kiondo", "crate", "dozen", "bag"].map((u) => (<button key={u} type="button" onClick={() => setNp({ ...np, unit: u })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.unit === u ? "bg-primary text-primary-foreground" : "bg-secondary")}>{u}</button>))}
            </div>
          </div>
          <div className="sm:col-span-2"><Label>Category (10 like Jiji)</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]].map((c: any) => (
                <button key={c[0]} type="button" onClick={() => setNp({ ...np, category: c[0] })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.category === c[0] ? "bg-primary text-primary-foreground" : "bg-secondary")}>{c[1]}</button>
              ))}
            </div>
          </div>
          <div><Label>Upload photo</Label><ImageUpload value={np.image} onChange={(url: string) => setNp({ ...np, image: url })} /></div>
          <div><Label>Or paste photo link</Label><Input value={np.imageUrl} onChange={(e) => setNp({ ...np, imageUrl: e.target.value })} placeholder="https://..." /></div>
          <div className="sm:col-span-2"><Label>Brand (optional)</Label><Input value={np.brand} onChange={(e) => setNp({ ...np, brand: e.target.value })} placeholder="e.g. Samsung" /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea value={np.desc} onChange={(e) => setNp({ ...np, desc: e.target.value })} rows={3} placeholder="Size, quality, where it comes from..." /></div>
        </div>
        <Button className="mt-3" onClick={addProduct}>Put on the market</Button>
      </div>`;
    v = v.slice(0, s) + NEWCARD + v.slice(e + eStr.length);
    console.log('Deep product form rebuilt');
  }
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
}
fs.writeFileSync('src/components/vendor-bar.tsx', `import { Link } from "@tanstack/react-router";
import { useMyVendor } from "@/lib/my-vendor";
import { BarChart3, Store } from "lucide-react";
export function VendorBar() {
  const { vendor } = useMyVendor();
  if (!vendor) return null;
  return (
    <div className="border-t border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs font-semibold">
        <span className="shrink-0 text-muted-foreground">Seller tools:</span>
        <Link to="/vendor" className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground"><Store className="size-3.5" /> Shop dashboard</Link>
        <Link to="/pos" className="shrink-0 rounded-full bg-secondary px-3 py-1">POS & Receipts</Link>
        <Link to="/chats" className="shrink-0 rounded-full bg-secondary px-3 py-1">Customer chats</Link>
        <Link to="/profile" className="shrink-0 rounded-full bg-secondary px-3 py-1">My profile</Link>
        {vendor.subscription_plan === "pro" ? <Link to="/pro" className="flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-accent-deep"><BarChart3 className="size-3.5" /> Pro Studio</Link> : null}
      </div>
    </div>
  );
}
`);
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('VendorBar')) {
  chrome = chrome.split('import { ChatFab } from "@/components/chat-fab";').join('import { ChatFab } from "@/components/chat-fab";\nimport { VendorBar } from "@/components/vendor-bar";');
  chrome = chrome.split('</header>').join('<VendorBar /></header>');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Seller tools bar visible on every page');
}
for (const f of ['src/components/product-card.tsx', 'src/routes/product.$id.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.replace(/\(Number\((\w+)\.offer_price_kes\) > 0 \? formatKes\(Number\(\1\.offer_price_kes\)\) : formatKes\(Number\(\1\.price_kes\)\)\)/g, '(Number($1.offer_price_kes) > 0 ? <span className="whitespace-nowrap"><s className="mr-1 opacity-60">{formatKes(Number($1.price_kes))}</s><span className="font-bold text-accent-deep">{formatKes(Number($1.offer_price_kes))}</span></span> : formatKes(Number($1.price_kes)))');
  if (c !== before) { fs.writeFileSync(f, c); console.log('Jumia-style crossed pricing:', f); }
}
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (prod.includes('<video') && !prod.includes('max-w-[260px]')) {
  prod = prod.replace(/<video([^>]*?)className="[^"]*"/g, '<video$1className="mt-2 max-w-[260px] rounded-xl border border-border"');
  prod = prod.replace(/<video(?![^>]*className)([^>]*?)>/g, '<video className="mt-2 max-w-[260px] rounded-xl border border-border"$1>');
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Amazon-style compact video');
}
let chat = fs.readFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', 'utf8');
if (chat.includes('✏️ Edit my profile')) {
  chat = chat.split('✏️ Edit my profile').join('✏️ Edit MY profile (only you can edit it)');
  fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', chat);
  console.log('Chat edit button clarified');
}
let prof = fs.readFileSync('src/routes/_authenticated/profile.tsx', 'utf8');
if (!prof.includes('Private - only you')) {
  prof = prof.split('<p className="mt-1 text-sm text-muted-foreground">Your name and photo as customers see them in chat.</p>').join('<p className="mt-1 text-sm text-muted-foreground">Your name and photo as customers see them in chat.</p>\n      <p className="mt-1 text-xs font-semibold text-success">🔒 Private - only YOU can view & edit this page. Nobody else can touch your profile.</p>');
  fs.writeFileSync('src/routes/_authenticated/profile.tsx', prof);
  console.log('Profile privacy note');
}
console.log('DONE');