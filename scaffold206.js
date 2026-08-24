import fs from 'fs';

// ---- Fix product page: change the bad { ... } wrapper to ( ... ) ----
const pf = 'src/routes/product.$id.tsx';
let p = fs.readFileSync(pf, 'utf8');
const OLD = '{isVid(gallery[img]) ? <video src={gallery[img]} controls playsInline className="aspect-[4/3] w-full bg-black object-contain" /> : <img src={gallery[img]} alt={product.title} className="aspect-[4/3] w-full object-cover" />}';
const NEW = '(isVid(gallery[img]) ? <video src={gallery[img]} controls playsInline className="aspect-[4/3] w-full bg-black object-contain" /> : <img src={gallery[img]} alt={product.title} className="aspect-[4/3] w-full object-cover" />)';
if (p.includes(OLD)) { p = p.split(OLD).join(NEW); console.log('product: brackets fixed'); }
else console.log('product: OLD not found (checking...)');
fs.writeFileSync(pf, p);

// ---- Ensure Button imported in enrich ----
const ef = 'src/routes/_authenticated/enrich.$id.tsx';
let e = fs.readFileSync(ef, 'utf8');
if (!/import \{[^}]*\bButton\b[^}]*\} from "@\/components\/ui\/button"/.test(e)) {
  e = e.split('import { ImageUpload } from "@/components/image-upload";').join('import { ImageUpload } from "@/components/image-upload";\nimport { Button } from "@/components/ui/button";');
  fs.writeFileSync(ef, e);
  console.log('enrich: Button import ensured');
}

console.log('DONE');