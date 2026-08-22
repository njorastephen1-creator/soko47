import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let changed = false;
if (!v.includes('const { vendor, vendors, loading } = useMyVendor();') && v.includes('const { vendor, vendors } = useMyVendor();')) {
  v = v.split('const { vendor, vendors } = useMyVendor();').join('const { vendor, vendors, loading } = useMyVendor();');
  changed = true;
}
const vBlockA = '  if (!loading && !vendor) {\n    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50);\n    return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>;\n  }\n';
const vBlockB = '  if (!vendor) {\n    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50);\n    return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>;\n  }\n  return null;\n';
const vGood = '  if (loading) return <p className="py-16 text-center text-muted-foreground">Loading your dashboard...</p>;\n';
if (v.includes(vBlockA)) { v = v.split(vBlockA).join(vGood); changed = true; console.log('vendor: variant A fixed'); }
else if (v.includes(vBlockB)) { v = v.split(vBlockB).join(vGood); changed = true; console.log('vendor: variant B fixed'); }
if (changed) fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
if (v.includes('setTimeout(() => navigate({ to: "/" })')) console.log('VENDOR STILL REDIRECTS - paste vendor.tsx');

let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
changed = false;
if (!p.includes('isLoading: mvLoading') && p.includes('const { data: myVendor } = useQuery({')) {
  p = p.split('const { data: myVendor } = useQuery({').join('const { data: myVendor, isLoading: mvLoading } = useQuery({');
  changed = true;
}
const pBlockA = '  if (!mvLoading && !myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }';
const pBlockB = '  if (!myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }';
const pGood = '  if (mvLoading) return <p className="py-16 text-center text-muted-foreground">Loading POS...</p>;\n  if (!myVendor) return <p className="py-16 text-center text-muted-foreground">POS is for traders - open a shop first.</p>;';
if (p.includes(pBlockA)) { p = p.split(pBlockA).join(pGood); changed = true; console.log('pos: variant A fixed'); }
else if (p.includes(pBlockB)) { p = p.split(pBlockB).join(pGood); changed = true; console.log('pos: variant B fixed'); }
if (changed) fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
if (p.includes('setTimeout(() => navigate({ to: "/" })')) console.log('POS STILL REDIRECTS - paste pos.tsx');

let pro = fs.readFileSync('src/routes/_authenticated/pro.tsx', 'utf8');
changed = false;
if (!pro.includes('const { vendor, loading } = useMyVendor();') && pro.includes('const { vendor } = useMyVendor();')) {
  pro = pro.split('const { vendor } = useMyVendor();').join('const { vendor, loading } = useMyVendor();');
  changed = true;
}
const proBad = 'if (!vendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }';
const proGood = 'if (!vendor) return <p className="py-16 text-center text-muted-foreground">Pro Studio is for traders - open a shop first.</p>;';
if (pro.includes(proBad)) { pro = pro.split(proBad).join(proGood); changed = true; console.log('pro: redirect removed'); }
if (!pro.includes('if (loading) return') && pro.includes(proGood)) {
  pro = pro.split(proGood).join('if (loading) return <p className="py-16 text-center text-muted-foreground">Loading Pro Studio...</p>;\n  ' + proGood);
  changed = true;
}
if (changed) fs.writeFileSync('src/routes/_authenticated/pro.tsx', pro);
if (pro.includes('setTimeout(() => navigate({ to: "/" })') || pro.includes('<Navigate')) console.log('PRO STILL REDIRECTS - paste pro.tsx');
console.log('DONE - no more auto-redirects anywhere');