import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, Download, MessageCircle, Megaphone, ShoppingCart, Sparkles, Trash2, TrendingUp, Users, Wallet, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export function BusinessTab({ vendorId }: { vendorId: string }) {
  const qc = useQueryClient();
  const [exp, setExp] = useState({ label: "", amount: "", category: "transport" });
  const [sale, setSale] = useState({ title: "", quantity: "1", amount: "" });
  const [offer, setOffer] = useState("Habari! Fresh stock just arrived at our shop this week. Karibu!");
  const { data } = useQuery({
    queryKey: ["business", vendorId],
    queryFn: async () => {
      const { data: items } = await supabase.from("order_items").select("title, quantity, unit_price_kes, status, created_at, orders(buyer_name, buyer_phone)").eq("vendor_id", vendorId);
      const { data: products } = await supabase.from("products").select("title, stock, is_active").eq("vendor_id", vendorId);
      const { data: expenses } = await supabase.from("vendor_expenses").select("*").eq("vendor_id", vendorId).order("spent_on", { ascending: false });
      const { data: sales } = await supabase.from("vendor_sales").select("*").eq("vendor_id", vendorId).order("sold_on", { ascending: false });
      return { items: items || [], products: products || [], expenses: expenses || [], sales: sales || [] };
    },
  });
  const items = data?.items || [];
  const products = data?.products || [];
  const expenses = data?.expenses || [];
  const sales = data?.sales || [];
  const delivered = items.filter(i => i.status === "delivered");
  const onlineRevenue = delivered.reduce((s, i) => s + Number(i.unit_price_kes) * i.quantity, 0);
  const cashRevenue = sales.reduce((s, x) => s + Number(x.amount_kes), 0);
  const revenue = onlineRevenue + cashRevenue;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount_kes), 0);
  const purchases = expenses.filter(e => e.category === "stock");
  const lowStock = products.filter(p => p.is_active && p.stock <= 5);
  const customers = Object.values(items.reduce((acc: any, i) => {
    const phone = i.orders?.buyer_phone;
    if (!phone) return acc;
    if (!acc[phone]) acc[phone] = { name: i.orders.buyer_name, phone, spent: 0, orders: 0, last: i.created_at };
    acc[phone].spent += Number(i.unit_price_kes) * i.quantity;
    acc[phone].orders += 1;
    if (i.created_at > acc[phone].last) acc[phone].last = i.created_at;
    return acc;
  }, {})) as any[];
  customers.sort((a, b) => b.spent - a.spent);
  const tips: string[] = [];
  if (customers[0]) tips.push("Your best customer is " + customers[0].name + " (" + formatKes(customers[0].spent) + " so far). A small thank-you discount keeps them loyal.");
  const quiet = customers.filter(c => Date.now() - new Date(c.last).getTime() > 14 * 86400000);
  if (quiet.length > 0) tips.push(quiet.length + " customers have been quiet for 2+ weeks - use the broadcast box below to win them back.");
  const byTitle = items.reduce((acc: any, i) => { acc[i.title] = (acc[i.title] || 0) + Number(i.unit_price_kes) * i.quantity; return acc; }, {});
  const topTitle = Object.keys(byTitle).sort((a, b) => byTitle[b] - byTitle[a])[0];
  if (topTitle) tips.push("Your fastest mover is " + topTitle + " - never let it go out of stock.");
  if (revenue > 0 && totalExpenses === 0) tips.push("Record your expenses (transport, market fees, stock) to see your true profit.");
  const ledger = [
    ...items.map(i => ({ when: i.created_at, title: i.title + " (online)", qty: i.quantity, total: Number(i.unit_price_kes) * i.quantity, tag: i.status })),
    ...sales.map(s => ({ when: new Date(s.sold_on).toISOString(), title: s.title + " (" + s.channel + ")", qty: s.quantity, total: Number(s.amount_kes), tag: s.channel }))
  ].sort((a, b) => (a.when < b.when ? 1 : -1));
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
  const removeExpense = async (id: string) => { await supabase.from("vendor_expenses").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["business", vendorId] }); };
  const addSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sale.title.trim().length < 2) return toast.error("What did you sell?");
    if (!(Number(sale.amount) > 0)) return toast.error("Enter the amount");
    const { error } = await supabase.from("vendor_sales").insert({ vendor_id: vendorId, title: sale.title.trim(), quantity: Number(sale.quantity) || 1, amount_kes: Number(sale.amount) });
    if (error) return toast.error(error.message);
    toast.success("Cash sale recorded");
    setSale({ title: "", quantity: "1", amount: "" });
    qc.invalidateQueries({ queryKey: ["business", vendorId] });
  };
  const exportCsv = () => {
    const rows = [["Date", "Item", "Qty", "Total", "Channel/Status"]];
    ledger.forEach(l => rows.push([new Date(l.when).toLocaleString(), l.title, String(l.qty), String(l.total), l.tag]));
    rows.push([]);
    rows.push(["EXPENSES"]);
    expenses.forEach(e => rows.push([String(e.spent_on), e.label + " (" + e.category + ")", "1", "-" + String(e.amount_kes), "expense"]));
    const csv = rows.map(r => r.map(c => '"' + String(c).split('"').join('""') + '"').join(",")).join("\n");
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
        <Stat icon={TrendingUp} label="Total revenue (online + cash)" value={formatKes(revenue)} />
        <Stat icon={Wallet} label="Expenses" value={formatKes(totalExpenses)} />
        <Stat icon={TrendingUp} label="Real profit" value={formatKes(revenue - totalExpenses)} />
        <Stat icon={Store} label="Cash sales recorded" value={sales.length} />
      </div>
      {tips.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-accent bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-deep"><Sparkles className="size-4" /> Smart business insights</p>
          <ul className="mt-3 space-y-2 text-sm">{tips.map((t, i) => (<li key={i}>• {t}</li>))}</ul>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-warning" /> Low stock alert</p>
          <p className="mt-1 text-sm text-muted-foreground">{lowStock.map(p => p.title + " (" + p.stock + " left)").join(", ")}</p>
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="flex items-center gap-2 font-semibold"><ShoppingCart className="size-4 text-accent-deep" /> Record a cash / stall sale (POS)</h3>
          <form onSubmit={addSale} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
            <Input placeholder="What did you sell? e.g. 2 crates of tomatoes" value={sale.title} onChange={(e) => setSale({ ...sale, title: e.target.value })} />
            <div className="flex gap-3">
              <Input placeholder="Qty" inputMode="numeric" value={sale.quantity} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} />
              <Input placeholder="Amount (KSh)" inputMode="numeric" value={sale.amount} onChange={(e) => setSale({ ...sale, amount: e.target.value })} />
            </div>
            <Button type="submit" size="sm">Save cash sale</Button>
          </form>
          <h3 className="mt-6 font-semibold">Record an expense</h3>
          <form onSubmit={addExpense} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
            <Input placeholder="e.g. Bus fare, county fees, wages..." value={exp.label} onChange={(e) => setExp({ ...exp, label: e.target.value })} />
            <div className="flex gap-3">
              <Input placeholder="Amount (KSh)" inputMode="numeric" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
              <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
                <option value="transport">Transport</option>
                <option value="market-fees">Market fees</option>
                <option value="stock">Buying stock</option>
                <option value="rent">Stall rent</option>
                <option value="wages">Helper wages</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button type="submit" size="sm">Save expense</Button>
          </form>
          <div className="mt-3 space-y-2">
            {expenses.slice(0, 5).map((e: any) => (
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
          <h3 className="flex items-center gap-2 font-semibold"><Megaphone className="size-4 text-accent-deep" /> Broadcast an offer (Marketing)</h3>
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <Textarea value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={300} />
            <p className="mt-2 text-xs text-muted-foreground">Tap a customer below to send this offer straight to their WhatsApp.</p>
          </div>
          <h3 className="mt-6 flex items-center gap-2 font-semibold"><Users className="size-4 text-accent-deep" /> Your customers</h3>
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
                  <Button asChild variant="outline" size="sm"><a href={"https://wa.me/" + String(c.phone).replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(offer)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Send</a></Button>
                </div>
              ))}
            </div>
          )}
          <h3 className="mt-6 font-semibold">Stock purchases (cost of goods)</h3>
          {purchases.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Record "Buying stock" expenses and they will appear here.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {purchases.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm">
                  <p>{p.label} <span className="text-xs text-muted-foreground">· {p.spent_on}</span></p>
                  <span className="font-medium">{formatKes(Number(p.amount_kes))}</span>
                </div>
              ))}
              <p className="text-sm font-semibold">Total invested in stock: {formatKes(purchases.reduce((s, p) => s + Number(p.amount_kes), 0))}</p>
            </div>
          )}
        </section>
      </div>
      <h3 className="mt-8 font-semibold">Full sales ledger (online + cash)</h3>
      {ledger.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No sales yet. Record your first cash sale above or receive an online order.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {ledger.slice(0, 15).map((l, idx) => (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{l.title} × {l.qty}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.when).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatKes(l.total)}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{l.tag}</span>
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
}