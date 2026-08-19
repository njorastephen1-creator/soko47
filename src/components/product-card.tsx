import { Link } from "@tanstack/react-router";
import { MapPin, Package, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { addToCart, formatKes } from "@/lib/cart";
import { LikeButton } from "@/components/like-button";
export type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price_kes: number | string;
  unit: string;
  stock: number;
  image_url: string | null;
  likes_count?: number | null;
  category_slug: string;
  subcategory?: string | null;
  vendor_id: string;
  vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null;
};
export function ProductCard({ product }: { product: ProductRow }) {
  const add = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors ? product.vendors.shop_name : "", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-1 top-1 z-10 px-1.5 py-0.5 text-[10px]" />
      <Link to="/product/$id" params={{ id: product.id }} className="flex flex-1 flex-col">
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <Package className="m-auto size-8 text-muted-foreground" />}
        </div>
        <div className="flex flex-1 flex-col p-1.5">
          <p className="font-display text-sm font-extrabold text-accent-deep">{formatKes(Number(product.price_kes))}</p>
          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">{product.title}</p>
          <p className="mt-1 flex items-center gap-0.5 text-[10px] text-muted-foreground"><MapPin className="size-2.5" /> {product.vendors ? product.vendors.market_name : ""}</p>
          {product.vendors && Number((product.vendors as any).rating_count) > 0 ? <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-warning"><Star className="size-2.5 fill-warning text-warning" /> {((Number((product.vendors as any).rating_sum) / Number((product.vendors as any).rating_count)).toFixed(1))} ({(product.vendors as any).rating_count})</p> : null}
        </div>
      </Link>
      <div className="flex items-center justify-between px-1.5 pb-1.5">
        <span className="rounded bg-secondary px-1 py-0.5 text-[9px] font-medium text-muted-foreground">Verified</span>
        <button onClick={add} aria-label="Add to basket" className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"><Plus className="size-3.5" /></button>
      </div>
    </div>
  );
}
