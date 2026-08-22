import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Megaphone, Package, Star, Store, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatKes } from "@/lib/cart";
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });
function AdminPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorPage, setVendorPage] = useState(0);
  const [listingFilter, setListingFilter] = useState("all");
  const [listingSearch, setListingSearch] = useState("");
  const [listingPage, setListingPage] = useState(0);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(0);
  const isAdm = isAdminEmail(session?.user?.email);
  const { data: vendors } = useQuery({ queryKey: ["adm-vendors"], queryFn: async () => { const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: products } = useQuery({ queryKey: ["adm-products"], queryFn: async () => { const { data } = await supabase.from("products").select("*, vendors(shop_name)").order("created_at", { ascending: false }); return data || []; } });
  const { data: orders } = useQuery({ queryKey: ["adm-orders"], queryFn: async () => { const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: trash } = useQuery({ queryKey: ["adm-trash"], queryFn: async () => { const { data } = await supabase.from("trash").select("*").order("deleted_at", { ascending: false }); return data || []; } });
  const { data: users } = useQuery({ queryKey: ["adm-users"], enabled: isAdm, queryFn: async () => { const { data } = await supabase.rpc("user_directory"); return data || []; } });
  if (!isAdm) return <p className="py-16 text-center text-muted-foreground">Admins only.</p>;
  const gmv = (orders || []).reduce((s, o) => s + Number(o.total_kes || 0), 0);
  const pendingV = (vendors || []).filter((v: any) => v.approval_status === "pending").length;
  const downV = (vendors || []).filter((v: any) => v.status !== "active").length;
  const setVendor = async (id: string, patch: any, msg: string) => { await supabase.from("vendors").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const setProduct = async (id: string, patch: any, msg: string) => { await supabase.from("products").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const toTrash = async (table: string, id: string, label: string) => {
    if (!window.confirm("Move " + label + " to Trash? You can restore it anytime from the Trash tab.")) return;
    const { data: row } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    if (!row) return toast.error("Not found");
    const { error: te } = await supabase.from("trash").insert({ table_name: table, record: row, deleted_by: session ? session.user.email : "" });
    if (te) return toast.error(te.message);
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Moved to Trash - restore anytime");
  };
  const restore = async (t: any) => {
    const { error } = await supabase.from(t.table_name).insert(t.record);
    if (error) return toast.error(error.message);
    await supabase.from("trash").delete().eq("id", t.id);
    qc.invalidateQueries();
    toast.success("Restored");
  };
  const purge = async (t: any) => {
    if (!window.confirm("Permanently delete " + (t.record && t.record.title ? t.record.title : "this item") + "? This CANNOT be undone.")) return;
    await supabase.from("trash").delete().eq("id", t.id);
    qc.invalidateQueries();
    toast.success("Purged forever");
  };
  const delVendor = async (id: string, label: string) => toTrash("vendors", id, label);
  const delOrder = async (id: string, label: string) => toTrash("orders", id, label);
  const delUser = async (id: string) => {
    if (!window.confirm("Delete this user account?")) return;
    await supabase.from("auth.users").delete().eq("id", id);
    qc.invalidateQueries();
    toast.success("User deleted");
  };
  const delProduct = async (id: string) => { await supabase.from("products").delete().eq("id", id); qc.invalidateQueries(); toast.success("Listing removed"); };
  const setOrder = async (id: string, status: string) => { await supabase.from("orders").update({ status }).eq("id", id); qc.invalidateQueries(); toast.success("Order " + status); };
  const broadcast = async () => {
    if (!bTitle.trim() || !bBody.trim()) return toast.error("Add title and message");
    const { data: all } = await supabase.rpc("user_directory");
    const rows = (all || []).map((u: any) => ({ user_id: u.id, title: bTitle.trim(), body: bBody.trim(), link: "/" }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return toast.error(error.message);
    setBTitle(""); setBBody("");
    toast.success("Broadcast sent to " + rows.length + " users!");
  };
  const tabs = ["overview", "vendors", "listings", "orders", "users", "broadcast"];
  const card = "rounded-2xl border border-border bg-card p-5";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Admin command center</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (<button key={t} onClick={() => setTab(t)} className={"rounded-full border px-4 py-1.5 text-sm capitalize " + (tab === t ? "border-accent bg-accent font-semibold text-foreground" : "border-border bg-card")}>{t}</button>))}
      </div>
      {tab === "overview" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className={card}><Wallet className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{formatKes(gmv)}</p><p className="text-xs text-muted-foreground">Marketplace value</p></div>
            <div className={card}><Package className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(orders || []).length}</p><p className="text-xs text-muted-foreground">Orders</p></div>
            <div className={card}><Store className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(vendors || []).length}</p><p className="text-xs text-muted-foreground">Shops ({pendingV} pending)</p></div>
            <div className={card}><Package className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(products || []).length}</p><p className="text-xs text-muted-foreground">Live listings</p></div>
            <div className={card}><Users className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(users || []).length}</p><p className="text-xs text-muted-foreground">Registered users</p></div>
            <div className={card}><Ban className="size-5 text-destructive" /><p className="mt-2 text-xl font-extrabold">{downV}</p><p className="text-xs text-muted-foreground">Blocked shops</p></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={card}>
              <h2 className="font-display font-bold">Latest orders</h2>
              <div className="mt-3 space-y-2">
                {(orders || []).slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between text-sm"><span>{o.buyer_name} · {formatKes(Number(o.total_kes))}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{o.status}</span></div>
                ))}
                {(orders || []).length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              </div>
            </div>
            <div className={card}>
              <h2 className="font-display font-bold">Newest shops</h2>
              <div className="mt-3 space-y-2">
                {(vendors || []).slice(0, 5).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between text-sm"><span>{v.shop_name} · {v.market_name}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{v.approval_status}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
            {tab === "vendors" && (
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
                          <td className="p-3 text-right"><button onClick={() => delVendor(v.id, v.shop_name)} className="text-destructive"><Ban className="size-4" /></button></td>
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
      )}
            {tab === "listings" && (
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
                              <Button size="sm" variant="outline" onClick={() => setProduct(p.id, { is_active: !p.is_active }, p.is_active ? "Listing hidden (suspended)" : "Listing live again")}><Ban className="size-3.5" /> {p.is_active ? "Hide" : "Show"}</Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p.id, p.title)}><Ban className="size-3.5" /> Remove</Button>
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
      )}
            {tab === "orders" && (
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
                          <td className="p-3 text-right"><button onClick={() => delOrder(o.id, "order " + o.buyer_name)} className="text-destructive"><Ban className="size-4" /></button></td>
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
      )}
            {tab === "users" && (
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
      )}
      {tab === "trash" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Everything you delete lands here first. Restore it or purge it forever - full control, zero accidents.</p>
          {(trash || []).length === 0 && <p className="text-sm text-muted-foreground">Trash is empty.</p>}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary text-left"><tr><th className="p-3">Item</th><th className="p-3">Type</th><th className="p-3">Deleted</th><th className="p-3">By</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {(trash || []).map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{t.record && (t.record.title || t.record.shop_name || t.record.buyer_name || t.id.slice(0, 6))}</td>
                    <td className="p-3 capitalize text-muted-foreground">{t.table_name}</td>
                    <td className="p-3 text-xs">{new Date(t.deleted_at).toLocaleString()}</td>
                    <td className="p-3 text-xs text-muted-foreground">{t.deleted_by}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => restore(t)}><CheckCircle2 className="size-3.5" /> Restore</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => purge(t)}><Ban className="size-3.5" /> Purge</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "broadcast" && (
        <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-display font-bold"><Megaphone className="size-5 text-accent-deep" /> Broadcast to all users</h2>
          <div className="mt-4 space-y-3">
            <Input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Title e.g. Soko47 now live in Kisumu!" />
            <Textarea value={bBody} onChange={(e) => setBBody(e.target.value)} placeholder="Message..." rows={4} />
            <Button onClick={broadcast}><Megaphone className="size-4" /> Send to everyone</Button>
          </div>
        </div>
      )}
    </div>
  );
}
