import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, MessageCircle, Phone } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
import { supabase } from "@/integrations/supabase/client";
import { addToCart, formatKes } from "@/lib/cart";
import { categoryName, getCounty } from "@/data/markets";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/product/$id")({ component: ProductDetail });
function ProductDetail() {
  const { id } = Route.useParams();
  const [qty, setQty] = useState(1);
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name, stall_info, phone, whatsapp)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="mx-auto max-w-6xl px-4 py-16">Loading...</p>;
  if (!product)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold">Item not found</h1>
        <Link to="/browse" className="mt-2 inline-block text-accent-deep underline">Back to browsing</Link>
      </div>
    );
  const county = product.vendors ? getCounty(product.vendors.county_slug) : undefined;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
        {product.image_url ? <img src={product.image_url} alt={product.title} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-7xl text-muted-foreground">🧺</div>}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{categoryName(product.category_slug)}{product.subcategory ? " · " + product.subcategory : ""}</p>
        <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>
        <p className="mt-4 font-display text-3xl font-extrabold">{formatKes(Number(product.price_kes))}<span className="text-base font-normal text-muted-foreground"> / {product.unit}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">{product.stock > 0 ? product.stock + " available" : "Currently sold out"}</p>
        {product.description && <p className="mt-5 whitespace-pre-line">{product.description}</p>}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-10 text-center">{qty}</span>
            <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="border border-border" />
          <Button size="lg" disabled={product.stock <= 0} onClick={() => { addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url }, qty); toast.success("Added to basket"); }}>Add to basket</Button>
        </div>
        {product.vendors && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sold by</p>
            <Link to="/shop/$slug" params={{ slug: product.vendors.slug }} className="font-display text-xl font-bold">{product.vendors.shop_name}</Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><BadgeCheck className="size-4 text-accent" />Verified seller · {product.vendors.market_name}{county ? " · " + county.county + " County" : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <FollowButton vendorId={product.vendor_id} />
              <Button asChild variant="outline" size="sm"><a href={"tel:" + product.vendors.phone}><Phone className="size-4" /> Call trader</a></Button>
              {product.vendors.whatsapp && (
                <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + product.vendors.whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}