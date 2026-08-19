import { Link } from "@tanstack/react-router";
import { MapPin, Package, Plus } from "lucide-react";
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
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-2 top-2 z-10 px-2 py-1" />
      <Link to="/product/$id" params={{ id: product.id }} className="flex flex-1 flex-col">
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <Package className="m-auto size-10 text-muted-foreground" />}
        </div>
        <div className="flex flex-1 flex-col p-2.5">
          <p className="font-display text-base font-extrabold text-accent-deep">{formatKes(Number(product.price_kes))}<span className="text-[10px] font-normal text-muted-foreground">/{product.unit}</span></p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.title}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" /> {product.vendors ? product.vendors.market_name : ""}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-2.5 pb-2.5">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Verified seller</span>
        <button onClick={add} aria-label="Add to basket" className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"><Plus className="size-4" /></button>
      </div>
    </div>
  );
}
