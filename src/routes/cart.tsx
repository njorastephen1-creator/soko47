import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingBasket, Trash2 } from "lucide-react";
import { formatKes, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/cart")({ component: CartPage });
function CartPage() {
  const { items, total } = useCart();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your basket</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <ShoppingBasket className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Your basket is empty.</p>
          <Button asChild className="mt-4"><Link to="/browse">Browse goods</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {i.imageUrl ? <img src={i.imageUrl} alt={i.title} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-6" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.title}</p>
                  <p className="text-sm text-muted-foreground">{i.shopName} · {formatKes(i.price)}/{i.unit}</p>
                </div>
                <div className="flex items-center rounded-md border border-border">
                  <button className="px-3 py-1.5" onClick={() => setQuantity(i.productId, i.quantity - 1)}>−</button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button className="px-3 py-1.5" onClick={() => setQuantity(i.productId, i.quantity + 1)}>+</button>
                </div>
                <p className="w-24 text-right font-semibold">{formatKes(i.price * i.quantity)}</p>
                <button onClick={() => removeFromCart(i.productId)} aria-label="Remove"><Trash2 className="size-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <span className="text-lg font-semibold">Total</span>
            <span className="font-display text-2xl font-extrabold">{formatKes(total)}</span>
          </div>
          <Button asChild size="lg" className="mt-5 w-full"><Link to="/checkout">Continue to checkout</Link></Button>
        </>
      )}
    </div>
  );
}