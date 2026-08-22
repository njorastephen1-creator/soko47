import fs from 'fs';
const f = 'src/routes/shop.$slug.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('subscriptionActive')) {
  c = c.split('  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;').join(`  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;
  const subscriptionActive = shop.status === "active" && (!shop.subscription_expires_at || new Date(shop.subscription_expires_at).getTime() > Date.now());
  const subscriptionExpired = shop.subscription_expires_at && new Date(shop.subscription_expires_at).getTime() <= Date.now();`);
  c = c.split('  const { data: products } = useQuery({\n    queryKey: ["shop-products", shop ? shop.id : ""],\n    enabled: !!shop && shop.status === "active",').join('  const { data: products } = useQuery({\n    queryKey: ["shop-products", shop ? shop.id : ""],\n    enabled: !!shop && subscriptionActive,');
  c = c.split('      {shop.status === "blocked" ? (').join(`      {shop.status === "blocked" ? (
        <div className="mt-8 rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="font-display text-xl font-bold text-destructive">This shop is temporarily suspended</p>
          <p className="mt-2 text-sm text-muted-foreground">The trader is settling their subscription. Please check back soon.</p>
        </div>
      ) : subscriptionExpired ? (
        <div className="mt-8 rounded-2xl border-2 border-warning bg-warning/10 p-8 text-center">
          <p className="font-display text-xl font-bold text-warning">This shop is temporarily closed</p>
          <p className="mt-2 text-sm text-muted-foreground">The trader needs to renew their subscription. The shop will reopen as soon as they do.</p>
        </div>
      ) : (!subscriptionActive ? (
        <div className="mt-8 rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="font-display text-xl font-bold text-destructive">This shop is closed</p>
          <p className="mt-2 text-sm text-muted-foreground">This shop is not currently active.</p>
        </div>
      ) : (`);
  c = c.split('        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">\n          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}\n        </div>\n      )}').join('        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">\n          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}\n        </div>\n      ))}');
  fs.writeFileSync(f, c);
  console.log('Shop: subscription gate added');
}
console.log('DONE');