import fs from 'fs';
import path from 'path';
const files = {
'src/components/like-button.tsx': `import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function LikeButton({ productId, likes = 0, className = "" }: { productId: string; likes?: number; className?: string }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: liked } = useQuery({
    queryKey: ["like", productId, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("product_likes").select("product_id").eq("user_id", session!.user.id).eq("product_id", productId).maybeSingle();
      return !!data;
    },
  });
  const toggle = async () => {
    if (!session) return toast.error("Sign in to like products");
    if (liked) await supabase.from("product_likes").delete().eq("user_id", session.user.id).eq("product_id", productId);
    else await supabase.from("product_likes").insert({ product_id: productId });
    qc.invalidateQueries({ queryKey: ["like", productId] });
  };
  return (
    <button onClick={toggle} aria-label="Like product" className={"flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1.5 text-xs font-medium shadow-soft transition-transform hover:scale-105 " + (liked ? "text-destructive" : "text-muted-foreground") + " " + className}>
      <Heart className={"size-4 " + (liked ? "fill-current" : "")} />{likes > 0 ? " " + likes : ""}
    </button>
  );
}`,

'src/components/follow-button.tsx': `import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
export function FollowButton({ vendorId, className = "" }: { vendorId: string; className?: string }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: following } = useQuery({
    queryKey: ["follow", vendorId, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendor_follows").select("vendor_id").eq("user_id", session!.user.id).eq("vendor_id", vendorId).maybeSingle();
      return !!data;
    },
  });
  const toggle = async () => {
    if (!session) return toast.error("Sign in to follow shops");
    if (following) {
      await supabase.from("vendor_follows").delete().eq("user_id", session.user.id).eq("vendor_id", vendorId);
      toast.success("Unfollowed shop");
    } else {
      await supabase.from("vendor_follows").insert({ vendor_id: vendorId });
      toast.success("Following! You'll be notified when they list new stock");
    }
    qc.invalidateQueries({ queryKey: ["follow", vendorId] });
  };
  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} className={className}>
      {following ? <><Check className="size-4" /> Following</> : <><BellRing className="size-4" /> Follow shop</>}
    </Button>
  );
}`,

'src/components/notifications-bell.tsx': `import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export function NotificationsBell() {
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["notifications", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false }).limit(12);
      return data || [];
    },
  });
  if (!session) return null;
  const unread = (data || []).filter(n => !n.read).length;
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", session.user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-md px-2 py-1.5 hover:bg-primary" aria-label="Notifications">
        <Bell className="size-5" />
        {unread > 0 && <span className="warm-surface absolute -top-0.5 right-0 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">{unread}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && <button className="text-xs text-accent-deep underline" onClick={markAll}>Mark all read</button>}
        </div>
        {(data || []).length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">No notifications yet. Follow a shop to hear about new stock!</p>
        ) : (
          (data || []).map(n => (
            <DropdownMenuItem key={n.id} onClick={async () => {
              await supabase.from("notifications").update({ read: true }).eq("id", n.id);
              qc.invalidateQueries({ queryKey: ["notifications"] });
              navigate({ to: n.link });
            }}>
              <span className={"block w-full " + (n.read ? "opacity-70" : "")}>
                <span className="block text-sm font-medium">{n.title}</span>
                <span className="block text-xs text-muted-foreground">{n.body}</span>
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
let card = fs.readFileSync('src/components/product-card.tsx', 'utf8');
if (!card.includes('LikeButton')) {
  card = card.split('import { addToCart, formatKes } from "@/lib/cart";').join('import { addToCart, formatKes } from "@/lib/cart";\nimport { LikeButton } from "@/components/like-button";');
  card = card.split('stock: number; image_url: string | null;').join('stock: number; image_url: string | null; likes_count?: number | null;');
  card = card.split('<div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">').join('<div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">\n      <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-3 top-3 z-10" />');
  fs.writeFileSync('src/components/product-card.tsx', card);
  console.log('Patched product-card.tsx (like button)');
}
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (!prod.includes('LikeButton')) {
  prod = prod.split('import { BadgeCheck, MessageCircle, Phone } from "lucide-react";').join('import { BadgeCheck, MessageCircle, Phone } from "lucide-react";\nimport { LikeButton } from "@/components/like-button";\nimport { FollowButton } from "@/components/follow-button";');
  prod = prod.split('<Button size="lg" disabled={product.stock <= 0}').join('<LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="border border-border" />\n          <Button size="lg" disabled={product.stock <= 0}');
  prod = prod.split('<div className="mt-4 flex flex-wrap gap-2">').join('<div className="mt-4 flex flex-wrap gap-2">\n              <FollowButton vendorId={product.vendor_id} />');
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Patched product.$id.tsx (like + follow)');
}
let shop = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8');
if (!shop.includes('FollowButton')) {
  shop = shop.split('import { getCounty } from "@/data/markets";').join('import { getCounty } from "@/data/markets";\nimport { FollowButton } from "@/components/follow-button";');
  shop = shop.split('<div className="ml-auto flex gap-2">').join('<div className="ml-auto flex flex-wrap items-center gap-2">\n            <FollowButton vendorId={shop.id} />');
  fs.writeFileSync('src/routes/shop.$slug.tsx', shop);
  console.log('Patched shop.$slug.tsx (follow button)');
}
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('NotificationsBell')) {
  chrome = chrome.split('import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";').join('import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";\nimport { NotificationsBell } from "@/components/notifications-bell";');
  chrome = chrome.split('<div className="ml-auto flex items-center gap-1">').join('<div className="ml-auto flex items-center gap-1">\n          <NotificationsBell />');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Patched site-chrome.tsx (notification bell)');
}
console.log('DONE: likes + follows + notifications');