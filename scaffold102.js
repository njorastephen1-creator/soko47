import fs from 'fs';
let orders = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');
if (!orders.includes('to="/profile"')) {
  orders = orders.split('      <h1 className="font-display text-3xl font-bold">My orders</h1>').join('      <div className="flex items-center justify-between gap-2"><h1 className="font-display text-3xl font-bold">My orders</h1><Button asChild size="sm" variant="outline"><Link to="/profile">👤 My profile</Link></Button></div>');
  fs.writeFileSync('src/routes/_authenticated/orders.tsx', orders);
  console.log('orders: profile button added');
}
let chats = fs.readFileSync('src/routes/_authenticated/chats.tsx', 'utf8');
if (!chats.includes('to="/profile"')) {
  chats = chats.split('      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Chats</h1>').join('      <div className="flex items-center justify-between gap-2"><h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Chats</h1><Button asChild size="sm" variant="outline"><Link to="/profile">👤 My profile</Link></Button></div>');
  if (!chats.includes('import { Button }')) chats = chats.split('import { useSession } from "@/lib/use-session";').join('import { useSession } from "@/lib/use-session";\nimport { Button } from "@/components/ui/button";');
  fs.writeFileSync('src/routes/_authenticated/chats.tsx', chats);
  console.log('chats: profile button added');
}
console.log('DONE');