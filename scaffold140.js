import fs from 'fs';
const f = 'src/routes/shop.$slug.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;\n  const subscriptionActive = shop.status === "active" && (!shop.subscription_expires_at || new Date(shop.subscription_expires_at).getTime() > Date.now());\n  const subscriptionExpired = shop.subscription_expires_at && new Date(shop.subscription_expires_at).getTime() <= Date.now();').join('  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;');
c = c.split('  const { data: products } = useQuery({').join('  const subscriptionActive = shop ? shop.status === "active" && (!shop.subscription_expires_at || new Date(shop.subscription_expires_at).getTime() > Date.now()) : false;\n  const subscriptionExpired = shop ? !!(shop.subscription_expires_at && new Date(shop.subscription_expires_at).getTime() <= Date.now()) : false;\n  const { data: products } = useQuery({');
fs.writeFileSync(f, c);
console.log('DONE: subscription consts moved above queries');