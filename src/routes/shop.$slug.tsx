import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCounty } from "@/data/markets";
import { FollowButton } from "@/components/follow-button";
import { ProductCard, type ProductRow } from "@/components/product-card";
export const Route = createFileRoute("/shop/$slug")({ component: ShopPage });
function ShopPage() {
  const { slug } = Route.useParams();
  const { data: shop } = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });
  const { data: products } = useQuery({
    queryKey: ["shop-products", shop ? shop.id : ""],
    enabled: !!shop && shop.status === "active",
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name)").eq("vendor_id", shop!.id).order("created_at", { ascending: false });
      return data as ProductRow[];
    },
  });
  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;
  const county = getCounty(shop.county_slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Store className="size-7" /></span>
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold">{shop.shop_name} <BadgeCheck className="size-5 text-accent" /></h1>
            <p className="text-sm text-muted-foreground">{shop.market_name} · {county ? county.county : ""} · {shop.followers_count ?? 0} followers</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FollowButton vendorId={shop.id} />
            {shop.phone && (<a href={"tel:" + shop.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"><Phone className="size-4" /> Call</a>)}
            {shop.whatsapp && (<a href={"https://wa.me/" + shop.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"><MessageCircle className="size-4" /> WhatsApp</a>)}
          </div>
        </div>
      </div>
      {shop.status === "blocked" ? (
        <div className="mt-8 rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="font-display text-xl font-bold text-destructive">This shop is temporarily suspended</p>
          <p className="mt-2 text-sm text-muted-foreground">The trader is settling their subscription. Please check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}
    </div>
  );
}