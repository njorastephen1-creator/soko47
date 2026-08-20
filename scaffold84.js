import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
if (!vendor.includes('const [prodFilter')) {
  vendor = vendor.split('  const [payPhone, setPayPhone] = useState("");').join(`  const [payPhone, setPayPhone] = useState("");
  const [prodFilter, setProdFilter] = useState("all");
  const [prodSearch, setProdSearch] = useState("");
  const [offers, setOffers] = useState<any>({});`);
  vendor = vendor.split('  const pendingCount = orderGroups.filter').join(`  const saveOffer = async (p: any) => {
    const val = offers[p.id];
    const num = val === "" || val == null ? null : Number(val);
    const { error } = await supabase.from("products").update({ offer_price_kes: num }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(num ? "Offer price live - buyers see the discount!" : "Offer removed");
  };
  const toggleHide = async (p: any) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(p.is_active ? "Product hidden from buyers" : "Product is live again");
  };
  const delProduct = async (p: any) => {
    if (!window.confirm("Delete " + p.title + " forever?")) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Product deleted");
  };
  const pendingCount = orderGroups.filter`);
  vendor = vendor.split('      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <h2 className="font-display text-xl font-bold">Your products</h2>\n        <div className="mt-3 space-y-2">\n          {(products || []).map((p: any) => (\n            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-2">\n              {p.image_url ? <img src={p.image_url} alt="" className="size-12 rounded-lg object-cover" /> : null}\n              <div className="min-w-0 flex-1">\n                <p className="truncate text-sm font-semibold">{p.title}</p>\n                <p className="text-xs text-muted-foreground">{formatKes(Number(p.price_kes))} · stock {p.stock}</p>\n              </div>\n              <Button asChild variant="outline" size="sm"><Link to="/enrich/$id" params={{ id: p.id }}>Add more info</Link></Button>\n            </div>\n          ))}\n          {(products || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet - add your first one.</p>}\n        </div>\n      </div>').join(`      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Your products</h2>
          <Input className="w-44" placeholder="Search products..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["all", "active", "hidden"].map((f) => (
            <button key={f} onClick={() => setProdFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (prodFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f === "active" ? "Live" : f}</button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {(products || []).filter((p: any) => (prodFilter === "all" ? true : prodFilter === "active" ? p.is_active : !p.is_active)).filter((p: any) => p.title.toLowerCase().includes(prodSearch.toLowerCase())).map((p: any) => (
            <div key={p.id} className="rounded-xl border border-border p-2">
              <div className="flex items-center gap-3">
                {p.image_url ? <img src={p.image_url} alt="" className="size-12 rounded-lg object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title} {!p.is_active ? <span className="rounded bg-secondary px-1 text-[10px]">HIDDEN</span> : null}</p>
                  <p className="text-xs text-muted-foreground">{formatKes(Number(p.price_kes))} · stock {p.stock}{p.offer_price_kes ? " · OFFER " + formatKes(Number(p.offer_price_kes)) : ""}</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link to="/enrich/$id" params={{ id: p.id }}>More info</Link></Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input className="w-32" placeholder="Offer price" value={offers[p.id] !== undefined ? offers[p.id] : p.offer_price_kes || ""} onChange={(e) => setOffers({ ...offers, [p.id]: e.target.value })} />
                <Button size="sm" variant="outline" onClick={() => saveOffer(p)}>Save offer</Button>
                <Button size="sm" variant="outline" onClick={() => toggleHide(p)}>{p.is_active ? "Hide" : "Show"}</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p)}>Delete</Button>
              </div>
            </div>
          ))}
          {(products || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet - add your first one.</p>}
        </div>
      </div>`);
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
console.log('Vendor product manager:', n);
let pos = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
if (!pos.includes('posFilter')) {
  pos = pos.split('  const [lines, setLines] = useState<Line[]>([]);').join('  const [lines, setLines] = useState<Line[]>([]);\n  const [posFilter, setPosFilter] = useState("all");');
  pos = pos.split('            <h2 className="font-semibold">Incoming orders</h2>').join('            <h2 className="font-semibold">Incoming orders</h2>\n            <div className="mt-2 flex flex-wrap gap-2">{["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => setPosFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (posFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>');
  pos = pos.split('{orderGroups.map((g: any) => (').join('{orderGroups.filter((g: any) => (posFilter === "all" ? true : g.status === posFilter)).map((g: any) => (');
  fs.writeFileSync('src/routes/_authenticated/pos.tsx', pos);
  console.log('POS filters added');
}
let orders = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');
if (!orders.includes('ordFilter')) {
  orders = orders.split('import { useState } from "react";').join('import { useState } from "react";');
  if (!orders.includes('import { useState')) orders = orders.split('import { toast } from "sonner";').join('import { useState } from "react";\nimport { toast } from "sonner";');
  orders = orders.split('  const qc = useQueryClient();').join('  const qc = useQueryClient();\n  const [ordFilter, setOrdFilter] = useState("all");');
  orders = orders.split('      <h1 className="font-display text-3xl font-bold">My orders</h1>').join('      <h1 className="font-display text-3xl font-bold">My orders</h1>\n      <div className="mt-3 flex flex-wrap gap-2">{["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => setOrdFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (ordFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>');
  orders = orders.split('{orders.map((o: any) => {').join('{orders.filter((o: any) => (ordFilter === "all" ? true : o.status === ordFilter)).map((o: any) => {');
  fs.writeFileSync('src/routes/_authenticated/orders.tsx', orders);
  console.log('Orders filters added');
}
for (const f of ['src/components/product-card.tsx', 'src/routes/product.$id.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.replace(/formatKes\(Number\((\w+)\.price_kes\)\)/g, '(Number($1.offer_price_kes) > 0 ? formatKes(Number($1.offer_price_kes)) : formatKes(Number($1.price_kes)))');
  if (c !== before) { fs.writeFileSync(f, c); console.log('Offer price shows on', f); }
}
console.log('DONE');