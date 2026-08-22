import fs from 'fs';
let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
if (!p.includes('rcPage')) {
  p = p.split('import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";').join('import { Minus, Plus, ReceiptText, Trash2, X } from "lucide-react";');
  p = p.split('  const [active, setActive] = useState<any>(null);').join('  const [active, setActive] = useState<any>(null);\n  const [rcFilter, setRcFilter] = useState("all");\n  const [rcPage, setRcPage] = useState(0);\n  const [ordPage, setOrdPage] = useState(0);');
  p = p.split('.order("created_at", { ascending: false }).limit(10);').join('.order("created_at", { ascending: false }).limit(200);');
  p = p.split('  return (\n    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">\n      <h1 className="font-display text-3xl font-bold">POS & Receipts</h1>').join(`  const filteredOrders = orderGroups.filter((g: any) => (posFilter === "all" ? true : g.status === posFilter));
  const ordPages = Math.max(0, Math.ceil(filteredOrders.length / 15) - 1);
  const ordSlice = filteredOrders.slice(ordPage * 15, ordPage * 15 + 15);
  const rcFiltered = (past || []).filter((r: any) => (rcFilter === "all" ? true : r.payment_method === rcFilter));
  const rcPages = Math.max(0, Math.ceil(rcFiltered.length / 15) - 1);
  const rcSlice = rcFiltered.slice(rcPage * 15, rcPage * 15 + 15);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">POS & Receipts</h1>`);
  p = p.split('{orderGroups.filter((g: any) => (posFilter === "all" ? true : g.status === posFilter)).map((g: any) => (').join('{ordSlice.map((g: any) => (');
  p = p.split('            </div>\n          </div>\n          <div className="rounded-3xl border border-border bg-card p-5">\n            <h2 className="font-semibold">Recent receipts</h2>').join(`            </div>
            {ordPages > 0 ? (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <button disabled={ordPage === 0} onClick={() => setOrdPage(ordPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                <span>Page {ordPage + 1} of {ordPages + 1}</span>
                <button disabled={ordPage >= ordPages} onClick={() => setOrdPage(ordPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent receipts</h2>`);
  p = p.split('            <div className="mt-2 space-y-1">\n              {(past || []).map((r: any) => (\n                <button key={r.id} onClick={() => setActive({ ...r, vendor: myVendor })} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-secondary">\n                  <span>#{String(r.receipt_no).padStart(4, "0")} · {r.customer_name || "Walk-in"} · {new Date(r.created_at).toLocaleDateString()}</span>\n                  <span className="font-semibold">{formatKes(Number(r.total_kes))}</span>\n                </button>\n              ))}\n              {(past || []).length === 0 && <p className="text-sm text-muted-foreground">No receipts yet.</p>}\n            </div>').join(`            <div className="mt-2 flex flex-wrap gap-2">{["all", "Cash", "M-Pesa", "Card", "Bank transfer"].map((f) => (<button key={f} onClick={() => { setRcFilter(f); setRcPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (rcFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-2">No.</th>
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Method</th>
                    <th className="py-2 pr-2 text-right">Total</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rcSlice.map((r: any) => (
                    <tr key={r.id} className="cursor-pointer border-b border-border/50 hover:bg-secondary" onClick={() => setActive({ ...r, vendor: myVendor })}>
                      <td className="py-2 pr-2 font-semibold">#{String(r.receipt_no).padStart(4, "0")}</td>
                      <td className="py-2 pr-2">{r.customer_name || "Walk-in"}</td>
                      <td className="py-2 pr-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-2 text-xs">{r.payment_method}</td>
                      <td className="py-2 pr-2 text-right font-semibold">{formatKes(Number(r.total_kes))}</td>
                      <td className="py-2 text-right text-xs font-semibold text-accent-deep">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rcFiltered.length === 0 && <p className="text-sm text-muted-foreground">No receipts yet.</p>}
            </div>
            {rcPages > 0 ? (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <button disabled={rcPage === 0} onClick={() => setRcPage(rcPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                <span>Page {rcPage + 1} of {rcPages + 1}</span>
                <button disabled={rcPage >= rcPages} onClick={() => setRcPage(rcPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            ) : null}`);
  p = p.split('          {active ? <ReceiptView receipt={active} /> : null}\n').join('');
  p = p.split('        </div>\n      </div>\n    </div>\n  );\n}').join(`        </div>
      </div>
      {active ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4" onClick={() => setActive(null)}>
          <div className="mx-auto my-8 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground" onClick={() => setActive(null)}><X className="size-4" /> Close</button>
            </div>
            <ReceiptView receipt={active} />
          </div>
        </div>
      ) : null}
    </div>
  );
}`);
  fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
  console.log('POS: modal + tables + pagination + filters');
}
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('ordPage')) {
  v = v.split('  const [offers, setOffers] = useState<any>({});').join('  const [offers, setOffers] = useState<any>({});\n  const [ordFilter, setOrdFilter] = useState("all");\n  const [ordPage, setOrdPage] = useState(0);');
  v = v.split('    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));\n  })();').join(`    return Object.values(map).sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  })();
  const filteredOrders = orderGroups.filter((g: any) => (ordFilter === "all" ? true : g.status === ordFilter));
  const ordPages = Math.max(0, Math.ceil(filteredOrders.length / 15) - 1);
  const ordSlice = filteredOrders.slice(ordPage * 15, ordPage * 15 + 15);`);
  v = v.split('        <h2 className="font-display text-xl font-bold">Incoming orders</h2>\n        <div className="mt-3 space-y-3">').join('        <h2 className="font-display text-xl font-bold">Incoming orders</h2>\n        <div className="mt-3 flex flex-wrap gap-2">{["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => { setOrdFilter(f); setOrdPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (ordFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>\n        <div className="mt-3 space-y-3">');
  v = v.split('{orderGroups.map((g: any) => (').join('{ordSlice.map((g: any) => (');
  v = v.split('          ))}\n        </div>\n      </div>\n      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <h2 className="font-display text-xl font-bold">My shops</h2>').join(`          ))}
        </div>
        {ordPages > 0 ? (
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <button disabled={ordPage === 0} onClick={() => setOrdPage(ordPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
            <span>Page {ordPage + 1} of {ordPages + 1}</span>
            <button disabled={ordPage >= ordPages} onClick={() => setOrdPage(ordPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        ) : null}
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">My shops</h2>`);
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: filters + pagination on incoming orders');
}
console.log('DONE');