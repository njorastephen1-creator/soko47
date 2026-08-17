import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/receipt/$id")({ component: ReceiptPage });
function ReceiptPage() {
  const { id } = Route.useParams();
  const { data: order } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, buyer_name, buyer_phone, delivery_location, status, total_kes, created_at, order_items(title, quantity, unit_price_kes, vendors(shop_name))").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (!order) return <p className="mx-auto max-w-3xl px-4 py-16">Loading receipt...</p>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()}><Printer className="size-4" /> Print / Save as PDF</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" /></span>
            <div>
              <p className="font-display text-lg font-bold">Soko47</p>
              <p className="text-xs text-muted-foreground">Official sales receipt</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Receipt #{order.id.slice(0, 8)}</p>
            <p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="grid gap-4 border-b border-border py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Buyer</p>
            <p className="font-medium">{order.buyer_name}</p>
            <p className="text-muted-foreground">{order.buyer_phone}</p>
            <p className="text-muted-foreground">{order.delivery_location}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{order.status}</p>
          </div>
        </div>
        <table className="w-full py-4 text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Item</th>
              <th className="py-2">Shop</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((i: any, idx: number) => (
              <tr key={idx} className="border-b border-border">
                <td className="py-2 font-medium">{i.title}</td>
                <td className="py-2 text-muted-foreground">{i.vendors?.shop_name ?? "-"}</td>
                <td className="py-2 text-center">{i.quantity}</td>
                <td className="py-2 text-right">{formatKes(Number(i.unit_price_kes) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between pt-4">
          <p className="font-semibold">Total</p>
          <p className="font-display text-xl font-extrabold">{formatKes(Number(order.total_kes))}</p>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">Asante kwa kununua kupitia Soko47 - built for Kenya's market traders.</p>
      </div>
    </div>
  );
}