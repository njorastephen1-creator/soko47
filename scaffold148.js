import fs from 'fs';

// my-vendor: expose loading state
let mv = fs.readFileSync('src/lib/my-vendor.ts', 'utf8');
if (!mv.includes('isLoading: loading')) {
  mv = mv.split('const { data: vendors } = useQuery({').join('const { data: vendors, isLoading: loading } = useQuery({');
  mv = mv.split('return { vendor, vendors: list };').join('return { vendor, vendors: list, loading };');
  fs.writeFileSync('src/lib/my-vendor.ts', mv);
  console.log('my-vendor: loading exposed');
}

// vendor: gate redirect on loading
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (v.includes('return null;\n  if (!vendor) return (')) {
  v = v.split('const { vendor, vendors } = useMyVendor();').join('const { vendor, vendors, loading } = useMyVendor();');
  v = v.split('  if (!vendor) {\n    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50);\n    return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>;\n  }\n  return null;\n  if (!vendor) return (').join('  if (!loading && !vendor) {\n    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50);\n    return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>;\n  }\n  if (!vendor) return (');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('vendor: redirect gated on loading');
}

// pos: gate redirect on loading
let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
if (p.includes('if (!myVendor) { if (typeof window')) {
  p = p.split('const { data: myVendor } = useQuery({').join('const { data: myVendor, isLoading: mvLoading } = useQuery({');
  p = p.split('if (!myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }').join('if (!mvLoading && !myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }');
  fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
  console.log('pos: redirect gated on loading');
}

// pro: stop the bounce - friendly message instead of redirect
let pro = fs.readFileSync('src/routes/_authenticated/pro.tsx', 'utf8');
if (pro.includes('setTimeout(() => navigate({ to: "/" }), 50)')) {
  pro = pro.split('if (!vendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }').join('if (!vendor) return <p className="py-16 text-center text-muted-foreground">Pro Studio is for traders - open a shop first.</p>;');
  fs.writeFileSync('src/routes/_authenticated/pro.tsx', pro);
  console.log('pro: bounce removed');
}
console.log('DONE');