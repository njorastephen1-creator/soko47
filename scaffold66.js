import fs from 'fs';
let pos = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
let n = 0;
if (!pos.includes('incoming-orders')) {
  pos = pos.split('  if (!myVendor) return <p className="py-16 text-center text-muted-foreground">Open a trader shop first to use the POS.</p>;').join(`  const { data: incoming } = useQuery({
    queryKey: ["incoming-orders", myVendor ? myVendor.id : "none"],
    enabled: !!myVendor,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("order_id, qty, price_kes, products(title), orders(*)").eq("vendor_id", myVendor!.id).order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
  });
  if (!myVendor) return <p className="py-16 text-center text-muted-foreground">Open a trader shop first to use the POS.</p>;`);
  pos = pos.split('  return (').join(`  const markStatus = async (orderId: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order updated");
  };
  const orderGroups: any[] = (() => {
    const map: any = {};
    (incoming || []).forEach((row: any) => {
      const o = row.orders;
      if (!o) return;
      if (!map[row.order_id]) map[row.order_id] = { id: row.order_id, buyer_name: o.buyer_name, buyer_phone: o.buyer_phone, delivery_location: o.delivery_location, status: o.status, payment_status: o.payment_status, created_at: o.created_at, items: [], total: 0 };
      map[row.order_id].items.push({ title: row.products ? row.products.title : "Item", qty: row.qty, price: Number(row.price_kes) });
      map[row.order_id].total += Number(row.price_kes) * row.qty;
    });
    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  })();
  return (`);
  pos = pos.split('          <div className="rounded-3xl border border-border bg-card p-5">\n            <h2 className="font-semibold">Recent receipts</h2>').join(`          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Incoming orders</h2>
            <div className="mt-2 space-y-3">
              {orderGroups.length === 0 && <p className="text-sm text-muted-foreground">No incoming orders yet - they land here the second a buyer checks out.</p>}
              {orderGroups.map((g: any) => (
                <div key={g.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{new Date(g.created_at).toLocaleString()}</span>
                    <span className={"rounded-full px-2 py-0.5 font-semibold " + (g.status === "fulfilled" ? "bg-success/15 text-success" : "bg-warning/20 text-foreground")}>{g.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{g.buyer_name} · <a className="underline" href={"tel:" + g.buyer_phone}>{g.buyer_phone}</a></p>
                  <p className="text-xs text-muted-foreground">{g.delivery_location || "Pickup at stall"}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {g.items.map((i: any, x: number) => (<div key={x} className="flex justify-between"><span>{i.title} x{i.qty}</span><span>{formatKes(i.price * i.qty)}</span></div>))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{formatKes(g.total)}</p>
                    <div className="flex gap-2">
                      {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}
                      {g.status !== "fulfilled" && <Button size="sm" onClick={() => markStatus(g.id, { status: "fulfilled" })}>Fulfill</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent receipts</h2>`);
  n++;
}
if (n > 0) { fs.writeFileSync('src/routes/_authenticated/pos.tsx', pos); console.log('DONE: incoming orders board'); }
else console.log('WARNING: nothing matched');