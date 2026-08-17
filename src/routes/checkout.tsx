import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearCart, formatKes, useCart } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export const Route = createFileRoute("/checkout")({ component: Checkout });
function Checkout() {
  const { items, total } = useCart();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ buyer_name: "", buyer_phone: "", delivery_location: "", note: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.buyer_name.trim().length < 2) return toast.error("Enter your name");
    if (form.buyer_phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    if (form.delivery_location.trim().length < 3) return toast.error("Where should the goods go?");
    if (!session) { toast.error("Please sign in to place an order"); navigate({ to: "/auth" }); return; }
    setSaving(true);
    const { data: order, error } = await supabase.from("orders").insert({ buyer_id: session.user.id, buyer_name: form.buyer_name.trim(), buyer_phone: form.buyer_phone.trim(), delivery_location: form.delivery_location.trim(), note: form.note.trim() || null, total_kes: total }).select().single();
    if (error || !order) { setSaving(false); toast.error(error?.message ?? "Could not place the order"); return; }
    const { error: itemsError } = await supabase.from("order_items").insert(items.map((i) => ({ order_id: order.id, product_id: i.productId, vendor_id: i.vendorId, title: i.title, unit_price_kes: i.price, quantity: i.quantity })));
    setSaving(false);
    if (itemsError) { toast.error(itemsError.message); return; }
    clearCart();
    toast.success("Order placed — the traders will contact you shortly");
    navigate({ to: "/orders" });
  };
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Button asChild className="mt-4"><Link to="/browse">Browse goods</Link></Button>
      </div>
    );
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Delivery details</h1>
        <div className="mt-5 space-y-4">
          <div><Label htmlFor="name">Full name</Label><Input id="name" value={form.buyer_name} maxLength={80} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} /></div>
          <div><Label htmlFor="phone">Phone number</Label><Input id="phone" placeholder="07XX XXX XXX" value={form.buyer_phone} maxLength={15} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} /></div>
          <div><Label htmlFor="loc">Delivery location / pickup point</Label><Input id="loc" placeholder="Estate, town or matatu stage" value={form.delivery_location} maxLength={160} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} /></div>
          <div><Label htmlFor="note">Note for the trader (optional)</Label><Textarea id="note" maxLength={400} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        </div>
        {!loading && !session && (
          <p className="mt-4 rounded-md bg-secondary p-3 text-sm">You need an account to place an order. <Link to="/auth" className="font-medium text-accent-deep underline">Sign in or create one</Link>.</p>
        )}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={saving}>{saving ? "Placing order..." : "Place order · " + formatKes(total)}</Button>
        <p className="mt-3 text-xs text-muted-foreground">Payment is agreed directly with each trader (M-Pesa on delivery or at the stall).</p>
      </form>
      <aside className="h-fit rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span>{i.title} × {i.quantity}<span className="block text-xs text-muted-foreground">{i.shopName}</span></span>
              <span className="font-medium">{formatKes(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>{formatKes(total)}</span></div>
      </aside>
    </div>
  );
}