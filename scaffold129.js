import fs from 'fs';
const f = 'src/routes/_authenticated/admin.tsx';
let c = fs.readFileSync(f, 'utf8');

if (!c.includes('vendorPage')) {
  c = c.split('  const [bTitle, setBTitle] = useState("");\n  const [bBody, setBBody] = useState("");').join('  const [bTitle, setBTitle] = useState("");\n  const [bBody, setBBody] = useState("");\n  const [vendorFilter, setVendorFilter] = useState("all");\n  const [vendorSearch, setVendorSearch] = useState("");\n  const [vendorPage, setVendorPage] = useState(0);\n  const [listingFilter, setListingFilter] = useState("all");\n  const [listingSearch, setListingSearch] = useState("");\n  const [listingPage, setListingPage] = useState(0);\n  const [orderFilter, setOrderFilter] = useState("all");\n  const [orderSearch, setOrderSearch] = useState("");\n  const [orderPage, setOrderPage] = useState(0);\n  const [userSearch, setUserSearch] = useState("");\n  const [userPage, setUserPage] = useState(0);');
}

if (!c.includes('delOrder')) {
  c = c.split('  const delProduct = async (id: string)').join(`  const delVendor = async (id: string) => {
    if (!window.confirm("Delete this shop and all its data?")) return;
    await supabase.from("vendors").delete().eq("id", id);
    qc.invalidateQueries();
    toast.success("Shop deleted");
  };
  const delOrder = async (id: string) => {
    if (!window.confirm("Delete this order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    qc.invalidateQueries();
    toast.success("Order deleted");
  };
  const delUser = async (id: string) => {
    if (!window.confirm("Delete this user account?")) return;
    await supabase.from("auth.users").delete().eq("id", id);
    qc.invalidateQueries();
    toast.success("User deleted");
  };
  const delProduct = async (id: string)`);
}

// === VENDORS TAB ===
if (c.includes('{tab === "vendors" && (')) {
  const vendorBlock = `      {tab === "vendors" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search shops..." value={vendorSearch} onChange={(e) => { setVendorSearch(e.target.value); setVendorPage(0); }} />
            {["all", "active", "suspended", "pending"].map((f) => (<button key={f} onClick={() => { setVendorFilter(f); setVendorPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (vendorFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}
          </div>
          {(() => {
            const rows = (vendors || []).filter((v: any) => {
              if (vendorFilter === "pending") return v.approval_status === "pending";
              if (vendorFilter === "active") return v.status === "active" && v.approval_status !== "pending";
              if (vendorFilter === "suspended") return v.status !== "active";
              return true;
            }).filter((v: any) => (v.shop_name || "").toLowerCase().includes(vendorSearch.toLowerCase()));
            const pages = Math.max(0, Math.ceil(rows.length / 15) - 1);
            const slice = rows.slice(vendorPage * 15, vendorPage * 15 + 15);
            return (
              <div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary text-left"><tr><th className="p-3">Shop</th><th className="p-3">Market</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Actions</th><th /></tr></thead>
                    <tbody>
                      {slice.map((v: any) => (
                        <tr key={v.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{v.shop_name}</td>
                          <td className="p-3 text-muted-foreground">{v.market_name}</td>
                          <td className="p-3 capitalize">{v.subscription_plan || v.plan || "trial"}</td>
                          <td className="p-3"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (v.status === "active" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{v.status}</span> {v.approval_status === "pending" && <span className="ml-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs">pending</span>}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {v.approval_status === "pending" && <Button size="sm" onClick={() => setVendor(v.id, { approval_status: "approved" }, "Shop approved")}><CheckCircle2 className="size-3.5" /> Approve</Button>}
                              {v.status === "active" ? <Button size="sm" variant="outline" onClick={() => setVendor(v.id, { status: "suspended" }, "Shop suspended")}><Ban className="size-3.5" /> Suspend</Button> : <Button size="sm" variant="outline" onClick={() => setVendor(v.id, { status: "active" }, "Shop reactivated")}><CheckCircle2 className="size-3.5" /> Reactivate</Button>}
                            </div>
                          </td>
                          <td className="p-3 text-right"><button onClick={() => delVendor(v.id)} className="text-destructive"><Ban className="size-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 0 ? (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <button disabled={vendorPage === 0} onClick={() => setVendorPage(vendorPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                    <span>Page {vendorPage + 1} of {pages + 1} · {rows.length} shops</span>
                    <button disabled={vendorPage >= pages} onClick={() => setVendorPage(vendorPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}`;
  const before = c.indexOf('{tab === "vendors" && (');
  const after = c.indexOf('{tab === "listings" && (');
  c = c.slice(0, before) + vendorBlock + '\n      ' + c.slice(after);
}

// === LISTINGS TAB ===
if (c.includes('{tab === "listings" && (')) {
  const listingBlock = `      {tab === "listings" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search listings..." value={listingSearch} onChange={(e) => { setListingSearch(e.target.value); setListingPage(0); }} />
            {["all", "active", "hidden", "featured"].map((f) => (<button key={f} onClick={() => { setListingFilter(f); setListingPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (listingFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}
          </div>
          {(() => {
            const rows = (products || []).filter((p: any) => {
              if (listingFilter === "active") return p.is_active;
              if (listingFilter === "hidden") return !p.is_active;
              if (listingFilter === "featured") return p.featured;
              return true;
            }).filter((p: any) => (p.title || "").toLowerCase().includes(listingSearch.toLowerCase()));
            const pages = Math.max(0, Math.ceil(rows.length / 15) - 1);
            const slice = rows.slice(listingPage * 15, listingPage * 15 + 15);
            return (
              <div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary text-left"><tr><th className="p-3">Product</th><th className="p-3">Shop</th><th className="p-3">Price</th><th className="p-3">Likes</th><th className="p-3">Actions</th></tr></thead>
                    <tbody>
                      {slice.map((p: any) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{p.title} {!p.is_active && <span className="ml-1 rounded bg-secondary px-1 text-[10px]">HIDDEN</span>}</td>
                          <td className="p-3 text-muted-foreground">{p.vendors ? p.vendors.shop_name : ""}</td>
                          <td className="p-3">{formatKes(Number(p.price_kes))}</td>
                          <td className="p-3">{p.likes_count || 0}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant={p.featured ? "default" : "outline"} onClick={() => setProduct(p.id, { featured: !p.featured }, p.featured ? "Removed from featured" : "Now featured on homepage")}><Star className="size-3.5" /> {p.featured ? "Featured" : "Feature"}</Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p.id)}><Ban className="size-3.5" /> Remove</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 0 ? (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <button disabled={listingPage === 0} onClick={() => setListingPage(listingPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                    <span>Page {listingPage + 1} of {pages + 1} · {rows.length} listings</span>
                    <button disabled={listingPage >= pages} onClick={() => setListingPage(listingPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}`;
  const before = c.indexOf('{tab === "listings" && (');
  const after = c.indexOf('{tab === "orders" && (');
  c = c.slice(0, before) + listingBlock + '\n      ' + c.slice(after);
}

// === ORDERS TAB ===
if (c.includes('{tab === "orders" && (')) {
  const orderBlock = `      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search buyer..." value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(0); }} />
            {["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => { setOrderFilter(f); setOrderPage(0); }} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (orderFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}
          </div>
          {(() => {
            const rows = (orders || []).filter((o: any) => (orderFilter === "all" ? true : o.status === orderFilter)).filter((o: any) => (o.buyer_name || "").toLowerCase().includes(orderSearch.toLowerCase()));
            const pages = Math.max(0, Math.ceil(rows.length / 15) - 1);
            const slice = rows.slice(orderPage * 15, orderPage * 15 + 15);
            return (
              <div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary text-left"><tr><th className="p-3">Buyer</th><th className="p-3">Phone</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th /></tr></thead>
                    <tbody>
                      {slice.map((o: any) => (
                        <tr key={o.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{o.buyer_name}</td>
                          <td className="p-3 text-muted-foreground">{o.buyer_phone}</td>
                          <td className="p-3">{formatKes(Number(o.total_kes))}</td>
                          <td className="p-3 text-xs">{o.payment_status || "-"}</td>
                          <td className="p-3">
                            <select value={o.status} onChange={(e) => setOrder(o.id, e.target.value)} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
                              {["pending", "confirmed", "delivering", "delivered", "cancelled"].map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          </td>
                          <td className="p-3 text-right"><button onClick={() => delOrder(o.id)} className="text-destructive"><Ban className="size-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 0 ? (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <button disabled={orderPage === 0} onClick={() => setOrderPage(orderPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                    <span>Page {orderPage + 1} of {pages + 1} · {rows.length} orders</span>
                    <button disabled={orderPage >= pages} onClick={() => setOrderPage(orderPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}`;
  const before = c.indexOf('{tab === "orders" && (');
  const after = c.indexOf('{tab === "users" && (');
  c = c.slice(0, before) + orderBlock + '\n      ' + c.slice(after);
}

// === USERS TAB ===
if (c.includes('{tab === "users" && (')) {
  const userBlock = `      {tab === "users" && (
        <div className="mt-6 space-y-3">
          <Input className="w-64" placeholder="Search by name or email..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }} />
          {(() => {
            const rows = (users || []).filter((u: any) => ((u.full_name || "") + " " + (u.email || "")).toLowerCase().includes(userSearch.toLowerCase()));
            const pages = Math.max(0, Math.ceil(rows.length / 15) - 1);
            const slice = rows.slice(userPage * 15, userPage * 15 + 15);
            return (
              <div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Joined</th><th /></tr></thead>
                    <tbody>
                      {slice.map((u: any) => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{u.full_name || "-"}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-right"><button onClick={() => delUser(u.id)} className="text-destructive"><Ban className="size-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pages > 0 ? (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <button disabled={userPage === 0} onClick={() => setUserPage(userPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
                    <span>Page {userPage + 1} of {pages + 1} · {rows.length} users</span>
                    <button disabled={userPage >= pages} onClick={() => setUserPage(userPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}`;
  const before = c.indexOf('{tab === "users" && (');
  const after = c.indexOf('{tab === "broadcast" && (');
  c = c.slice(0, before) + userBlock + '\n      ' + c.slice(after);
}

fs.writeFileSync(f, c);
console.log('DONE: admin dashboard with filters, search, pagination, delete');