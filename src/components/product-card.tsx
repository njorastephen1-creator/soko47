import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BadgeCheck, MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart, formatKes } from "@/lib/cart";
import { LikeButton } from "@/components/like-button";
export type ProductRow = { id: string; vendor_id: string; title: string; description: string | null; category_slug: string; subcategory?: string | null; price_kes: number; unit: string; stock: number; image_url: string | null; likes_count?: number | null; vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null };
export function ProductCard({ product }: { product: ProductRow }) {
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-3 top-3 z-10" />
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-12" /></div>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$id" params={{ id: product.id }}><h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3></Link>
        {product.vendors && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{product.vendors.market_name}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="font-display text-lg font-bold">{formatKes(Number(product.price_kes))}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span></p>
          <Button size="sm" onClick={add} disabled={product.stock <= 0}><Plus className="size-4" />{product.stock <= 0 ? "Sold out" : "Add"}</Button>
        </div>
        {product.vendors && (
          <p className="mt-3 flex items-center gap-1 border-t border-border pt-2 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-3.5 text-accent" /> Verified seller · {product.vendors.shop_name}
          </p>
        )}
      </div>
    </div>
  );
}