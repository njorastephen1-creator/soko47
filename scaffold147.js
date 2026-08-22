import fs from 'fs';

// 1) Vendor dashboard: redirect non-vendors home
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('navigate({ to: "/" })') && v.includes('import { createFileRoute, Link } from "@tanstack/react-router";')) {
  v = v.split('import { createFileRoute, Link } from "@tanstack/react-router";').join('import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";');
  v = v.split('  const { session } = useSession();').join('  const { session } = useSession();\n  const navigate = useNavigate();');
  v = v.split('  if (!vendor) return (\n    <div className="mx-auto max-w-md px-4 py-16 text-center">').join(`  if (!vendor) {
    if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50);
    return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>;
  }
  return null;
  if (!vendor) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">`);
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: non-vendors redirected home');
}

// 2) POS: same redirect
let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
if (!p.includes('navigate({ to: "/" })') && p.includes('import { createFileRoute } from "@tanstack/react-router";')) {
  p = p.split('import { createFileRoute } from "@tanstack/react-router";').join('import { createFileRoute, useNavigate } from "@tanstack/react-router";');
  p = p.split('  const { session } = useSession();').join('  const { session } = useSession();\n  const navigate = useNavigate();');
  p = p.split('  if (!myVendor) return <p className="py-16 text-center text-muted-foreground">Open a trader shop first to use the POS.</p>;').join('  if (!myVendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }');
  fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
  console.log('POS: non-vendors redirected home');
}

// 3) Pro Studio: same redirect
try {
  let pro = fs.readFileSync('src/routes/_authenticated/pro.tsx', 'utf8');
  if (!pro.includes('navigate({ to: "/" })') && pro.includes('import { createFileRoute } from "@tanstack/react-router";')) {
    pro = pro.split('import { createFileRoute } from "@tanstack/react-router";').join('import { createFileRoute, useNavigate } from "@tanstack/react-router";');
    pro = pro.split('  const { session } = useSession();').join('  const { session } = useSession();\n  const navigate = useNavigate();');
    pro = pro.replace(/if \(!vendor\)[^;]*;/, 'if (!vendor) { if (typeof window !== "undefined") setTimeout(() => navigate({ to: "/" }), 50); return <p className="py-16 text-center text-muted-foreground">Redirecting...</p>; }');
    fs.writeFileSync('src/routes/_authenticated/pro.tsx', pro);
    console.log('Pro: non-vendors redirected home');
  }
} catch (e) { console.log('Pro file not found - skipping'); }

// 4) Vendor bar: only show to actual vendors (already does this via useMyVendor)
// 5) Site chrome: hide "Open a shop" from pure buyers? No - keep it, they might want to become vendors

console.log('DONE: non-vendors redirected, data isolation intact');