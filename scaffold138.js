import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('QRCodeSVG')) {
  v = v.split('import { formatKes } from "@/lib/cart";').join('import { formatKes } from "@/lib/cart";\nimport { QRCodeSVG } from "qrcode.react";');
}
if (!v.includes('My unique shop link')) {
  v = v.split('  const county = getCounty(vendor.county_slug);').join(`  const shopUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/shop/" + vendor.slug;
  const vendorSubActive = vendor.status === "active" && (!vendor.subscription_expires_at || new Date(vendor.subscription_expires_at).getTime() > Date.now());
  const county = getCounty(vendor.county_slug);`);
  v = v.split('      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>').join(`      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">My unique shop link</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share it anywhere - customers open your shop inside Soko47 and can browse, order and chat. The link only works while your subscription is active.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="min-w-52 flex-1" readOnly value={shopUrl} />
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shopUrl); toast.success("Shop link copied - share it!"); }}>Copy link</Button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="rounded-xl bg-white p-2"><QRCodeSVG value={shopUrl} size={96} /></div>
          <p className="text-xs text-muted-foreground">Customers scan or tap the link to shop with you.</p>
        </div>
        {!vendorSubActive ? <p className="mt-3 text-sm font-semibold text-warning">Your subscription is inactive - this link shows a closed shop until you renew.</p> : null}
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>`);
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: shareable link + QR + subscription notice');
}
console.log('DONE');