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
    if (liked) {
      await supabase.from("product_likes").delete().eq("user_id", session.user.id).eq("product_id", productId);
    } else {
      const { error } = await supabase.from("product_likes").insert({ user_id: session.user.id, product_id: productId });
      if (error) return toast.error(error.message);
      toast.success("Added to your likes");
    }
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
      const { error } = await supabase.from("vendor_follows").insert({ user_id: session.user.id, vendor_id: vendorId });
      if (error) return toast.error(error.message);
      toast.success("Following! You'll be notified when they list new stock");
    }
    qc.invalidateQueries({ queryKey: ["follow", vendorId] });
  };
  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} className={className}>
      {following ? <><Check className="size-4" /> Following</> : <><BellRing className="size-4" /> Follow shop</>}
    </Button>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (!prod.includes('FollowButton')) {
  prod = prod.split('import { BadgeCheck, MessageCircle, Phone } from "lucide-react";').join('import { BadgeCheck, MessageCircle, Phone } from "lucide-react";\nimport { LikeButton } from "@/components/like-button";\nimport { FollowButton } from "@/components/follow-button";');
  prod = prod.split('<Button size="lg" disabled={product.stock <= 0}').join('<LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="border border-border" />\n          <Button size="lg" disabled={product.stock <= 0}');
  prod = prod.split('<div className="mt-4 flex flex-wrap gap-2">').join('<div className="mt-4 flex flex-wrap gap-2">\n              <FollowButton vendorId={product.vendor_id} />');
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Patched product.$id.tsx (like + follow)');
} else console.log('product.$id.tsx already has follow');
let shop = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8');
if (!shop.includes('FollowButton')) {
  shop = shop.split('import { getCounty } from "@/data/markets";').join('import { getCounty } from "@/data/markets";\nimport { FollowButton } from "@/components/follow-button";');
  shop = shop.split('<div className="ml-auto flex gap-2">').join('<div className="ml-auto flex flex-wrap items-center gap-2">\n            <FollowButton vendorId={shop.id} />');
  fs.writeFileSync('src/routes/shop.$slug.tsx', shop);
  console.log('Patched shop.$slug.tsx (follow button)');
} else console.log('shop.$slug.tsx already has follow');
console.log('DONE: likes + follows fixed');