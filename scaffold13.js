import fs from 'fs';
import path from 'path';
const files = {
'src/components/business-tab.tsx': `import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, Download, MessageCircle, ShoppingBag, Trash2, TrendingUp, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function BusinessTab({ vendorId }: { vendorId: string }) {
  const qc = useQueryClient();
  const [exp, setExp] = useState({ label: "", amount: "", category: "transport" });
  const { data } = useQuery({
    queryKey: ["business", vendorId],
    queryFn: async () => {
      const { data: items } = await supabase.from("order_items").select("title, quantity, unit_price_kes, status, created_at, order_id, orders(buyer_name, buyer_phone)").eq("vendor_id", vendorId).order("created_at", { ascending: false });
      const { data: products } = await supabase.from("products").select("title, stock, is_active").eq("vendor_id", vendorId);
      const { data: expenses } = await supabase.from("vendor_expenses").select("*").eq("vendor_id", vendorId).order("spent_on", { ascending: false });
      return { items: items || [], products: products || [], expenses: expenses || [] };
    },
  });
  const items = data?.items || [];
  const products = data?.products || [];
  const expenses = data?.expenses || [];
  const delivered = items.filter(i => i.status === "delivered");
  const revenue = delivered.reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount_kes), 0);
  const today = new Date().toDateString();
  const todayRevenue = delivered.filter(i => new Date(i.created_at).toDateString() === today).reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const lowStock = products.filter(p => p.is_active && p.stock <= 5);
  const customers = Object.values(items.reduce((acc: any, i) => {
    const phone = i.orders?.buyer_phone;
    if (!phone) return acc;
    if (!acc[phone]) acc[phone] = { name: i.orders.buyer_name, phone, spent: 0, orders: 0 };
    acc[phone].spent += Number(i.unit_price_kes) * i.quantity;
    acc[phone].orders += 1;
    return acc;
  }, {})) as any[];
  customers.sort((a, b) => b.spent - a.spent);
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exp.label.trim().length < 2) return toast.error("What was this expense for?");
    if (!(Number(exp.amount) > 0)) return toast.error("Enter the amount");
    const { error } = await supabase.from("vendor_expenses").insert({ vendor_id: vendorId, label: exp.label.trim(), category: exp.category, amount_kes: Number(exp.amount) });
    if (error) return toast.error(error.message);
    toast.success("Expense recorded");
    setExp({ label: "", amount: "", category: "transport" });
    qc.invalidateQueries({ queryKey: ["business", vendorId] });
  };
  const removeExpense = async (id: string) => {
    await supabase.from("vendor_expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["business", vendorId] });
  };
  const exportCsv = () => {
    const rows = [["Date", "Item", "Qty", "Total", "Status"]];
    items.forEach(i => rows.push([new Date(i.created_at).toLocaleString(), i.title, String(i.quantity), String(Number(i.unit_price_kes) * i.quantity), i.status]));
    rows.push([]);
    rows.push(["EXPENSES"]);
    expenses.forEach(e => rows.push([String(e.spent_on), e.label + " (" + e.category + ")", "1", "-" + String(e.amount_kes), "expense"]));
    const csv = rows.map(r => r.map(c => '"' + String(c).split('"').join('""') + '"').join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "soko47-business-records.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Biashara Suite - zero paperwork</h2>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4" /> Download full records (CSV)</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat icon={TrendingUp} label="Revenue (delivered)" value={formatKes(revenue)} />
        <Stat icon={Wallet} label="Expenses" value={formatKes(totalExpenses)} />
        <Stat icon={TrendingUp} label="Real profit" value={formatKes(revenue - totalExpenses)} />
        <Stat icon={CalendarDays} label="Today's sales" value={formatKes(todayRevenue)} />
      </div>
      {lowStock.length > 0 && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-warning" /> Low stock alert</p>
          <p className="mt-1 text-sm text-muted-foreground">{lowStock.map(p => p.title + " (" + p.stock + " left)").join(", ")}</p>
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="font-semibold">Record an expense</h3>
          <form onSubmit={addExpense} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
            <Input placeholder="e.g. Bus fare to market, county fees..." value={exp.label} onChange={(e) => setExp({ ...exp, label: e.target.value })} />
            <div className="flex gap-3">
              <Input placeholder="Amount (KSh)" inputMode="numeric" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
                <option value="transport">Transport</option>
                <option value="market-fees">Market fees</option>
                <option value="stock">Buying stock</option>
                <option value="rent">Stall rent</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button type="submit" size="sm">Save expense</Button>
          </form>
          <div className="mt-3 space-y-2">
            {expenses.slice(0, 6).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
                <p>{e.label} <span className="text-xs text-muted-foreground">· {e.category} · {e.spent_on}</span></p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">-{formatKes(Number(e.amount_kes))}</span>
                  <button onClick={() => removeExpense(e.id)} aria-label="Delete"><Trash2 className="size-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-accent-deep" /> Your customers</h3>
          {customers.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Customers appear automatically after their first order.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {customers.slice(0, 6).map((c: any) => (
                <div key={c.phone} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.orders} orders · {formatKes(c.spent)} spent</p>
                  </div>
                  <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + String(c.phone).replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent("Habari " + c.name + "! New stock just arrived at our shop. Karibu tena!")} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <h3 className="mt-8 font-semibold">Sales ledger</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No sales yet. Your digital ledger fills up automatically as orders come in.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((i: any, idx: number) => (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{i.title} × {i.quantity}</p>
                <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatKes(Number(i.unit_price_kes) * i.quantity)}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{i.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Icon className="size-4 text-accent-deep" />
      <p className="mt-2 text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}`,

'src/routes/_authenticated/receipt.$id.tsx': `import { createFileRoute } from "@tanstack/react-router";
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
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
let orders = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');
if (!orders.includes('View receipt')) {
  orders = orders.replace('<p className="mt-3 border-t border-border pt-3 text-right font-semibold">{formatKes(Number(o.total_kes))}</p>', '<p className="mt-3 border-t border-border pt-3 text-right font-semibold">{formatKes(Number(o.total_kes))}</p>\n            <p className="mt-2 text-right"><Link to="/receipt/$id" params={{ id: o.id }} className="text-xs font-medium text-accent-deep underline">View receipt</Link></p>');
  fs.writeFileSync('src/routes/_authenticated/orders.tsx', orders);
  console.log('Patched orders.tsx (receipt link)');
}
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!vendor.includes('Receipt</Link>')) {
  vendor = vendor.replace('<p className="font-medium">{i.title} × {i.quantity}</p>', '<p className="font-medium">{i.title} × {i.quantity} <Link to="/receipt/$id" params={{ id: i.order_id }} className="ml-2 text-xs text-accent-deep underline">Receipt</Link></p>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Patched vendor.tsx (receipt link)');
}
console.log('DONE: biashara suite v1');