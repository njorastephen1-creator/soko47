import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCounty } from "@/data/markets";
import { FollowButton } from "@/components/follow-button";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/shop/$slug")({ component: ShopPage });
function ShopPage() {
  const { slug } = Route.useParams();
  const { data: shop, isLoading } = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: products } = useQuery({
    queryKey: ["shop-products", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name)").eq("vendor_id", shop!.id).eq("is_active", true);
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });
  if (isLoading) return <p className="mx-auto max-w-6xl px-4 py-16">Loading...</p>;
  if (!shop)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold">Shop not found</h1>
        <Link to="/browse" className="mt-2 inline-block text-accent-deep underline">Browse other goods</Link>
      </div>
    );
  const county = getCounty(shop.county_slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">{shop.shop_name.slice(0, 1)}</div>
          <div>
            <h1 className="text-3xl font-bold">{shop.shop_name}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><BadgeCheck className="size-4 text-accent" />Verified · {shop.market_name}{county ? " · " + county.county + " County" : ""}{shop.stall_info ? " · " + shop.stall_info : ""}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FollowButton vendorId={shop.id} />
            <Button asChild variant="outline" size="sm"><a href={"tel:" + shop.phone}><Phone className="size-4" /> Call</a></Button>
            {shop.whatsapp && (
              <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + shop.whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
            )}
          </div>
        </div>
        {shop.description && <p className="mt-4 text-sm">{shop.description}</p>}
      </div>
      <h2 className="mt-10 text-2xl font-bold">On sale</h2>
      {products && products.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <p className="mt-3 text-muted-foreground">This shop has no active listings right now.</p>
      )}
    </div>
  );
}