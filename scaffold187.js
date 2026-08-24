import fs from 'fs';

// ---- Social: clean media sizing, no black letterbox ----
const sf = 'src/routes/social.tsx';
let s = fs.readFileSync(sf, 'utf8');
s = s.split('(<div className="mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black" style={{ maxHeight: "65vh" }}><video src={p.media_url} controls autoPlay muted loop playsInline className="w-full object-contain" style={{ maxHeight: "65vh" }} /></div>)').join('(<video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto mt-3 block max-w-full rounded-xl" style={{ maxHeight: "65vh" }} />)');
s = s.split('(<div className="mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black" style={{ maxHeight: "70vh" }}><img src={p.media_url} alt={p.title || "ad"} className="w-full object-contain" style={{ maxHeight: "70vh" }} /></div>)').join('(<img src={p.media_url} alt={p.title || "ad"} className="mx-auto mt-3 block max-w-full rounded-xl" style={{ maxHeight: "70vh" }} />)');
fs.writeFileSync(sf, s);
console.log('Social: clean media, no black bars');

// ---- Vendor: + Add product scrolls to the on-page form ----
const vf = 'src/routes/_authenticated/vendor.tsx';
let v = fs.readFileSync(vf, 'utf8');
// anchor at the Add a product heading
if (!v.includes('id="add-product"')) {
  v = v.split('Add a product</h2>').join('<span id="add-product" className="block" />Add a product</h2>');
}
const scrollBtn = '<button onClick={() => document.getElementById("add-product")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold">+ Add product</button>';
let changed = false;
const before1 = v;
v = v.replace(/<Button asChild[^>]*>\s*<Link to="\/sell"[^>]*>[^<]*Add product[^<]*<\/Link>\s*<\/Button>/, scrollBtn);
if (v !== before1) changed = true;
const before2 = v;
v = v.replace(/<Link to="\/sell"[^>]*>[^<]*Add product[^<]*<\/Link>/, scrollBtn);
if (v !== before2) changed = true;
fs.writeFileSync(vf, v);
console.log(changed ? 'Vendor: Add product now scrolls to form' : 'Vendor: button markup not matched - check');