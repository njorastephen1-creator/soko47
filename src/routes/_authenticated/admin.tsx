import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Bike, CheckCircle2, Megaphone, MessageCircle, Package, ReceiptText, RotateCcw, Star, Store, Trash2, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatKes } from "@/lib/cart";
import { useSettings } from "@/lib/use-settings";
import { LiveMap } from "@/components/live-map";
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });
const PAGE = 15;
function Pager(props: any) {
  if (props.pages <= 0) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-xs font-semibold">
      <button disabled={props.page === 0} onClick={() => props.setPage(props.page - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
      <span>Page {props.page + 1} of {props.pages + 1} · {props.total} {props.label}</span>
      <button disabled={props.page >= props.pages} onClick={() => props.setPage(props.page + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
    </div>
  );
}
function Chips(props: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((f: string) => (
        <button key={f} onClick={() => props.onChange(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (props.value === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>
      ))}
    </div>
  );
}
function AdminPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const isAdm = isAdminEmail(session ? session.user.email : "");
  const [tab, setTab] = useState("overview");
  const settings = useSettings();
  const [setForm, setSetForm] = useState<any>(null);
  const sForm = setForm || settings;
  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [vSearch, setVSearch] = useState(""); const [vFilter, setVFilter] = useState("all"); const [vPage, setVPage] = useState(0);
  const [lSearch, setLSearch] = useState(""); const [lFilter, setLFilter] = useState("all"); const [lPage, setLPage] = useState(0);
  const [oSearch, setOSearch] = useState(""); const [oFilter, setOFilter] = useState("all"); const [oPage, setOPage] = useState(0);
  const [rSearch, setRSearch] = useState(""); const [rPage, setRPage] = useState(0);
  const [uSearch, setUSearch] = useState(""); const [uPage, setUPage] = useState(0);
  const [rdFilter, setRdFilter] = useState("all"); const [rdPage, setRdPage] = useState(0);
  const [thread, setThread] = useState<any>(null);
  const { data: vendors } = useQuery({ queryKey: ["adm-vendors"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: products } = useQuery({ queryKey: ["adm-products"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("products").select("*, vendors(shop_name)").order("created_at", { ascending: false }); return data || []; } });
  const { data: orders } = useQuery({ queryKey: ["adm-orders"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: receipts } = useQuery({ queryKey: ["adm-receipts"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("receipts").select("*, vendors(shop_name)").order("created_at", { ascending: false }); return data || []; } });
  const { data: riders } = useQuery({ queryKey: ["adm-riders"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("riders").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: users } = useQuery({ queryKey: ["adm-users"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.rpc("user_directory"); return data || []; } });
  const { data: msgs } = useQuery({ queryKey: ["adm-msgs"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: activeDel } = useQuery({ queryKey: ["adm-active"], enabled: !!isAdm, refetchInterval: 8000, queryFn: async () => { const { data } = await supabase.from("orders").select("*, vendors(shop_name, lat, lng)").in("delivery_status", ["requested", "accepted"]).order("created_at", { ascending: false }); return data || []; } });
  const { data: socialPosts } = useQuery({ queryKey: ["adm-social"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: reports } = useQuery({ queryKey: ["adm-reports"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("post_reports").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: trash } = useQuery({ queryKey: ["adm-trash"], enabled: !!isAdm, queryFn: async () => { const { data } = await supabase.from("trash").select("*").order("deleted_at", { ascending: false }); return data || []; } });
  if (!isAdm) return <p className="py-16 text-center text-muted-foreground">Admins only.</p>;
  const setVendor = async (id: string, patch: any, msg: string) => { await supabase.from("vendors").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const setProduct = async (id: string, patch: any, msg: string) => { await supabase.from("products").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const setOrder = async (id: string, patch: any, msg: string) => { await supabase.from("orders").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const setRider = async (id: string, patch: any, msg: string) => { await supabase.from("riders").update(patch).eq("id", id); qc.invalidateQueries(); toast.success(msg); };
  const toTrash = async (table: string, id: string, label: string) => {
    if (!window.confirm("Move " + label + " to Trash? Restore it anytime from the Trash tab.")) return;
    const { data: row } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    if (!row) return toast.error("Record not found");
    const { error: te } = await supabase.from("trash").insert({ table_name: table, record: row, deleted_by: session ? session.user.email : "" });
    if (te) return toast.error(te.message);
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Moved to Trash - reversible");
  };
  const delUser = async (u: any) => {
    if (!window.confirm("Delete user " + u.email + "? Restorable from Trash (they reset password after restore).")) return;
    const { error } = await supabase.rpc("admin_delete_user", { uid: u.id });
    if (error) return toast.error(error.message);
    await supabase.from("trash").insert({ table_name: "users", record: { id: u.id, email: u.email, full_name: u.full_name }, deleted_by: session ? session.user.email : "" });
    qc.invalidateQueries();
    toast.success("User deleted - restorable from Trash");
  };
  const restore = async (t: any) => {
    if (t.table_name === "users") {
      const { error } = await supabase.rpc("admin_restore_user", { em: t.record.email });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from(t.table_name).insert(t.record);
      if (error) return toast.error(error.message);
    }
    await supabase.from("trash").delete().eq("id", t.id);
    qc.invalidateQueries();
    toast.success("Restored");
  };
  const delPost = async (id: string) => { if (!window.confirm("Remove this ad?")) return; await supabase.from("posts").delete().eq("id", id); qc.invalidateQueries(); toast.success("Ad removed"); };
  const dismissReport = async (id: string) => { await supabase.from("post_reports").delete().eq("id", id); qc.invalidateQueries(); toast.success("Report dismissed"); };
  const purge = async (t: any) => {
    if (!window.confirm("Purge forever? This CANNOT be undone.")) return;
    await supabase.from("trash").delete().eq("id", t.id);
    qc.invalidateQueries();
    toast.success("Purged forever");
  };
  const saveSettings = async () => {
    const { error } = await supabase.from("platform_settings").update({ settings: sForm }).eq("id", 1);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Platform pricing updated everywhere - no code needed");
  };
  const broadcast = async () => {
    if (!bTitle.trim() || !bBody.trim()) return toast.error("Add title and message");
    const { data: all } = await supabase.rpc("user_directory");
    const rows = (all || []).map((u: any) => ({ user_id: u.id, title: bTitle.trim(), body: bBody.trim(), link: "/" }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return toast.error(error.message);
    setBTitle(""); setBBody("");
    toast.success("Broadcast sent to " + rows.length + " users!");
  };
  const gmv = (orders || []).reduce((s: number, o: any) => s + Number(o.total_kes || 0), 0);
  const posSales = (receipts || []).reduce((s: number, r: any) => s + Number(r.total_kes || 0), 0);
  const paidCount = (orders || []).filter((o: any) => o.payment_status === "paid").length;
  const blocked = (vendors || []).filter((v: any) => v.status !== "active").length;
  const pendingV = (vendors || []).filter((v: any) => v.approval_status === "pending").length;
  const vRows = (vendors || []).filter((v: any) => (vFilter === "all" ? true : vFilter === "pending" ? v.approval_status === "pending" : vFilter === "suspended" ? v.status !== "active" : v.status === vFilter)).filter((v: any) => (v.shop_name || "").toLowerCase().includes(vSearch.toLowerCase()));
  const lRows = (products || []).filter((p: any) => (lFilter === "all" ? true : lFilter === "active" ? p.is_active : lFilter === "hidden" ? !p.is_active : p.featured)).filter((p: any) => (p.title || "").toLowerCase().includes(lSearch.toLowerCase()));
  const oRows = (orders || []).filter((o: any) => (oFilter === "all" ? true : o.status === oFilter)).filter((o: any) => (o.buyer_name || "").toLowerCase().includes(oSearch.toLowerCase()));
  const rRows = (receipts || []).filter((r: any) => ((r.customer_name || "") + " " + (r.vendors ? r.vendors.shop_name : "")).toLowerCase().includes(rSearch.toLowerCase()));
  const uRows = (users || []).filter((u: any) => ((u.full_name || "") + " " + (u.email || "")).toLowerCase().includes(uSearch.toLowerCase()));
  const rdRows = (riders || []).filter((r: any) => (rdFilter === "all" ? true : r.status === rdFilter));
  const threadsMap: any = {};
  (msgs || []).forEach((m: any) => {
    const k = m.vendor_id + "|" + m.buyer_id;
    if (!threadsMap[k]) threadsMap[k] = { key: k, vendor_id: m.vendor_id, buyer_id: m.buyer_id, count: 0, last: m.body, lastAt: m.created_at, names: [] as string[] };
    threadsMap[k].count += 1;
    if (m.sender_name && threadsMap[k].names.indexOf(m.sender_name) < 0) threadsMap[k].names.push(m.sender_name);
  });
  const threads = Object.values(threadsMap).sort((a: any, b: any) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  const threadMsgs = thread ? (msgs || []).filter((m: any) => m.vendor_id === thread.vendor_id && m.buyer_id === thread.buyer_id) : [];
  const tabs = ["overview", "vendors", "listings", "orders", "receipts", "users", "riders", "map", "social", "settings", "chats", "trash", "broadcast"];
  const card = "rounded-2xl border border-border bg-card p-5";
  const th = "border-b border-border bg-secondary text-left";
  const td = "p-3";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Admin command center</h1>
      <p className="mt-1 text-sm text-muted-foreground">Full visibility and control. Every delete is confirmed and reversible from Trash.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (<button key={t} onClick={() => setTab(t)} className={"rounded-full border px-4 py-1.5 text-sm capitalize " + (tab === t ? "border-accent bg-accent font-semibold text-foreground" : "border-border bg-card")}>{t}{t === "trash" && (trash || []).length > 0 ? " (" + (trash || []).length + ")" : ""}</button>))}
      </div>
      {tab === "overview" && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className={card}><Wallet className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{formatKes(gmv)}</p><p className="text-xs text-muted-foreground">Online GMV · {paidCount} paid</p></div>
          <div className={card}><ReceiptText className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{formatKes(posSales)}</p><p className="text-xs text-muted-foreground">POS sales · {(receipts || []).length} receipts</p></div>
          <div className={card}><Package className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(orders || []).length}</p><p className="text-xs text-muted-foreground">Orders</p></div>
          <div className={card}><Store className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(vendors || []).length}</p><p className="text-xs text-muted-foreground">Shops · {pendingV} pending · {blocked} blocked</p></div>
          <div className={card}><Package className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(products || []).length}</p><p className="text-xs text-muted-foreground">Listings</p></div>
          <div className={card}><Users className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(users || []).length}</p><p className="text-xs text-muted-foreground">Registered users</p></div>
          <div className={card}><Bike className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(riders || []).length}</p><p className="text-xs text-muted-foreground">Riders</p></div>
          <div className={card}><MessageCircle className="size-5 text-accent-deep" /><p className="mt-2 text-xl font-extrabold">{(msgs || []).length}</p><p className="text-xs text-muted-foreground">Chat messages</p></div>
          <div className={card}><Trash2 className="size-5 text-destructive" /><p className="mt-2 text-xl font-extrabold">{(trash || []).length}</p><p className="text-xs text-muted-foreground">In trash (restorable)</p></div>
        </div>
      )}
      {tab === "vendors" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search shops..." value={vSearch} onChange={(e) => { setVSearch(e.target.value); setVPage(0); }} />
            <Chips value={vFilter} options={["all", "active", "suspended", "pending"]} onChange={(f: string) => { setVFilter(f); setVPage(0); }} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Shop</th><th className={td}>Market</th><th className={td}>Plan</th><th className={td}>Status</th><th className={td}>Actions</th><th /></tr></thead>
              <tbody>
                {vRows.slice(vPage * PAGE, vPage * PAGE + PAGE).map((v: any) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{v.shop_name}</td>
                    <td className={td + " text-muted-foreground"}>{v.market_name}</td>
                    <td className={td + " capitalize"}>{v.subscription_plan || "trial"}</td>
                    <td className={td}><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (v.status === "active" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{v.status}</span> {v.approval_status === "pending" && <span className="ml-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs">pending</span>}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {v.approval_status === "pending" && <Button size="sm" onClick={() => setVendor(v.id, { approval_status: "approved" }, "Shop approved")}><CheckCircle2 className="size-3.5" /> Approve</Button>}
                        {v.status === "active" ? <Button size="sm" variant="outline" onClick={() => setVendor(v.id, { status: "suspended" }, "Shop suspended - reversible")}><Ban className="size-3.5" /> Suspend</Button> : <Button size="sm" variant="outline" onClick={() => setVendor(v.id, { status: "active" }, "Shop reactivated")}><CheckCircle2 className="size-3.5" /> Reactivate</Button>}
                      </div>
                    </td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => toTrash("vendors", v.id, "shop " + v.shop_name)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={vPage} pages={Math.max(0, Math.ceil(vRows.length / PAGE) - 1)} total={vRows.length} label="shops" setPage={setVPage} />
        </div>
      )}
      {tab === "listings" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search listings..." value={lSearch} onChange={(e) => { setLSearch(e.target.value); setLPage(0); }} />
            <Chips value={lFilter} options={["all", "active", "hidden", "featured"]} onChange={(f: string) => { setLFilter(f); setLPage(0); }} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Product</th><th className={td}>Shop</th><th className={td}>Price</th><th className={td}>Stock</th><th className={td}>Actions</th><th /></tr></thead>
              <tbody>
                {lRows.slice(lPage * PAGE, lPage * PAGE + PAGE).map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{p.title} {!p.is_active && <span className="ml-1 rounded bg-secondary px-1 text-[10px]">HIDDEN</span>}</td>
                    <td className={td + " text-muted-foreground"}>{p.vendors ? p.vendors.shop_name : ""}</td>
                    <td className={td}>{formatKes(Number(p.price_kes))}</td>
                    <td className={td}>{p.stock}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => setProduct(p.id, { is_active: !p.is_active }, p.is_active ? "Listing hidden - reversible" : "Listing live again")}><Ban className="size-3.5" /> {p.is_active ? "Hide" : "Show"}</Button>
                        <Button size="sm" variant={p.featured ? "default" : "outline"} onClick={() => setProduct(p.id, { featured: !p.featured }, p.featured ? "Removed from featured" : "Featured on homepage")}><Star className="size-3.5" /> {p.featured ? "Featured" : "Feature"}</Button>
                      </div>
                    </td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => toTrash("products", p.id, "listing " + p.title)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={lPage} pages={Math.max(0, Math.ceil(lRows.length / PAGE) - 1)} total={lRows.length} label="listings" setPage={setLPage} />
        </div>
      )}
      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-48" placeholder="Search buyer..." value={oSearch} onChange={(e) => { setOSearch(e.target.value); setOPage(0); }} />
            <Chips value={oFilter} options={["all", "pending", "fulfilled", "cancelled"]} onChange={(f: string) => { setOFilter(f); setOPage(0); }} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Buyer</th><th className={td}>Phone</th><th className={td}>Total</th><th className={td}>Payment</th><th className={td}>Status</th><th /></tr></thead>
              <tbody>
                {oRows.slice(oPage * PAGE, oPage * PAGE + PAGE).map((o: any) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{o.buyer_name}</td>
                    <td className={td + " text-muted-foreground"}>{o.buyer_phone}</td>
                    <td className={td}>{formatKes(Number(o.total_kes))}</td>
                    <td className={td}>
                      <select value={o.payment_status || "unpaid"} onChange={(e) => setOrder(o.id, { payment_status: e.target.value }, "Payment updated")} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
                        {["unpaid", "claimed", "paid"].map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                    <td className={td}>
                      <select value={o.status} onChange={(e) => setOrder(o.id, { status: e.target.value }, "Order " + e.target.value)} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
                        {["pending", "confirmed", "delivering", "fulfilled", "cancelled"].map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => toTrash("orders", o.id, "order of " + o.buyer_name)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={oPage} pages={Math.max(0, Math.ceil(oRows.length / PAGE) - 1)} total={oRows.length} label="orders" setPage={setOPage} />
        </div>
      )}
      {tab === "receipts" && (
        <div className="mt-6 space-y-3">
          <Input className="w-64" placeholder="Search customer or shop..." value={rSearch} onChange={(e) => { setRSearch(e.target.value); setRPage(0); }} />
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>No.</th><th className={td}>Shop</th><th className={td}>Customer</th><th className={td}>Method</th><th className={td}>Total</th><th className={td}>Items</th><th /></tr></thead>
              <tbody>
                {rRows.slice(rPage * PAGE, rPage * PAGE + PAGE).map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className={td + " font-semibold"}>#{String(r.receipt_no).padStart(4, "0")}</td>
                    <td className={td}>{r.vendors ? r.vendors.shop_name : ""}</td>
                    <td className={td}>{r.customer_name || "Walk-in"}</td>
                    <td className={td + " text-xs"}>{r.payment_method}</td>
                    <td className={td + " font-semibold"}>{formatKes(Number(r.total_kes))}</td>
                    <td className={td}>
                      <details><summary className="cursor-pointer text-xs font-semibold text-accent-deep">View</summary>
                        <div className="mt-1 space-y-0.5 text-xs">{(r.items || []).map((i: any, x: number) => (<div key={x}>{i.title} x{i.qty} · {formatKes(i.price * i.qty)}</div>))}</div>
                      </details>
                    </td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => toTrash("receipts", r.id, "receipt #" + r.receipt_no)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={rPage} pages={Math.max(0, Math.ceil(rRows.length / PAGE) - 1)} total={rRows.length} label="receipts" setPage={setRPage} />
        </div>
      )}
      {tab === "users" && (
        <div className="mt-6 space-y-3">
          <Input className="w-64" placeholder="Search name or email..." value={uSearch} onChange={(e) => { setUSearch(e.target.value); setUPage(0); }} />
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Name</th><th className={td}>Email</th><th className={td}>Joined</th><th /></tr></thead>
              <tbody>
                {uRows.slice(uPage * PAGE, uPage * PAGE + PAGE).map((u: any) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{u.full_name || "-"}</td>
                    <td className={td + " text-muted-foreground"}>{u.email}</td>
                    <td className={td + " text-xs"}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => delUser(u)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={uPage} pages={Math.max(0, Math.ceil(uRows.length / PAGE) - 1)} total={uRows.length} label="users" setPage={setUPage} />
        </div>
      )}
      {tab === "riders" && (
        <div className="mt-6 space-y-3">
          <Chips value={rdFilter} options={["all", "available", "busy", "offline"]} onChange={(f: string) => { setRdFilter(f); setRdPage(0); }} />
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Name</th><th className={td}>Phone</th><th className={td}>ID No.</th><th className={td}>Vehicle</th><th className={td}>Emergency</th><th className={td}>Docs</th><th className={td}>Area</th><th className={td}>Status</th><th /></tr></thead>
              <tbody>
                {rdRows.slice(rdPage * PAGE, rdPage * PAGE + PAGE).map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{r.name}</td>
                    <td className={td + " text-muted-foreground"}>{r.phone}</td>
                    <td className={td}>{r.id_number || "-"}</td>
                    <td className={td}>{r.vehicle_type || "-"}{r.vehicle_reg ? " · " + r.vehicle_reg : ""}</td>
                    <td className={td + " text-xs"}>{r.emergency_name || "-"} {r.emergency_phone ? "· " + r.emergency_phone : ""}</td>
                    <td className={td}><div className="flex gap-1">{r.id_image ? <a className="text-xs underline" href={r.id_image} target="_blank" rel="noreferrer">ID</a> : null}{r.vehreg_image ? <a className="text-xs underline" href={r.vehreg_image} target="_blank" rel="noreferrer">Reg</a> : null}{r.selfie_image ? <a className="text-xs underline" href={r.selfie_image} target="_blank" rel="noreferrer">Selfie</a> : null}</div></td>
                    <td className={td}>{r.area}</td>
                    <td className={td}>
                      <select value={r.status} onChange={(e) => setRider(r.id, { status: e.target.value }, "Rider status updated")} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
                        {["available", "busy", "offline"].map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                    <td className={td}><Button size="sm" variant="outline" className="text-destructive" onClick={() => toTrash("riders", r.id, "rider " + r.name)}><Trash2 className="size-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={rdPage} pages={Math.max(0, Math.ceil(rdRows.length / PAGE) - 1)} total={rdRows.length} label="riders" setPage={setRdPage} />
        </div>
      )}
      {tab === "chats" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Dispute-resolution view - read any conversation between a trader and a customer.</p>
          {!thread ? (
            <div className="space-y-2">
              {threads.map((t: any) => (
                <button key={t.key} onClick={() => setThread(t)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left text-sm hover:bg-secondary">
                  <span className="font-semibold">{t.names.join(" ↔ ")}</span>
                  <span className="text-xs text-muted-foreground">{t.count} messages · {new Date(t.lastAt).toLocaleString()}</span>
                </button>
              ))}
              {threads.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              <Button size="sm" variant="outline" onClick={() => setThread(null)}>Back to conversations</Button>
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {threadMsgs.map((m: any) => (
                  <div key={m.id} className="rounded-lg bg-secondary p-2 text-sm">
                    <p className="text-xs font-semibold">{m.sender_name} · {new Date(m.created_at).toLocaleString()}</p>
                    <p>{m.body}</p>
                    {m.attachment_url ? <p className="text-xs text-accent-deep">Attachment: {m.attachment_type}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "trash" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Nothing is ever lost by accident. Restore brings data back exactly as it was; Purge is permanent.</p>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className={th}><tr><th className={td}>Item</th><th className={td}>Type</th><th className={td}>Deleted</th><th className={td}>By</th><th className={td}>Actions</th></tr></thead>
              <tbody>
                {(trash || []).map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className={td + " font-medium"}>{t.record && (t.record.title || t.record.shop_name || t.record.buyer_name || t.record.email || t.id.slice(0, 6))}</td>
                    <td className={td + " capitalize text-muted-foreground"}>{t.table_name}</td>
                    <td className={td + " text-xs"}>{new Date(t.deleted_at).toLocaleString()}</td>
                    <td className={td + " text-xs text-muted-foreground"}>{t.deleted_by}</td>
                    <td className={td}>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => restore(t)}><RotateCcw className="size-3.5" /> Restore</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => purge(t)}><Ban className="size-3.5" /> Purge</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(trash || []).length === 0 && <p className="text-sm text-muted-foreground">Trash is empty.</p>}
        </div>
      )}
      {tab === "map" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Live oversight - every online rider (green) and every open/active delivery pickup (teal), refreshed every 8 seconds.</p>
          <LiveMap height="480px" points={[...(riders || []).filter((r: any) => r.lat != null).map((r: any) => ({ lat: Number(r.lat), lng: Number(r.lng), color: "#25D366", label: "Rider: " + r.name })), ...(activeDel || []).filter((o: any) => o.vendors && o.vendors.lat != null).map((o: any) => ({ lat: Number(o.vendors.lat), lng: Number(o.vendors.lng), color: "#0f766e", label: (o.delivery_status === "accepted" ? "ACTIVE: " : "OPEN: ") + o.buyer_name }))]} />
        </div>
      )}
      {tab === "social" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-bold">Reported ads</h2>
            <div className="mt-3 space-y-2">
              {(reports || []).length === 0 && <p className="text-sm text-muted-foreground">No reports - community is clean.</p>}
              {(reports || []).map((rp: any) => { const post = (socialPosts || []).find((sp: any) => sp.id === rp.post_id); return (
                <div key={rp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                  <span>{post ? (post.title || post.body || "ad") : "deleted ad"} · <span className="text-muted-foreground">"{rp.reason}"</span></span>
                  <div className="flex gap-1">{post ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => delPost(post.id)}>Remove ad</Button> : null}<Button size="sm" variant="outline" onClick={() => dismissReport(rp.id)}>Dismiss</Button></div>
                </div>
              ); })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-bold">All ads</h2>
            <div className="mt-3 space-y-2">
              {(socialPosts || []).slice(0, 30).map((p: any) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                  <span className="font-medium">{p.author_name} · {p.title || p.body || p.kind}</span>
                  <span className="text-xs text-muted-foreground">{p.views || 0} views · {p.kind}</span>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => delPost(p.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "settings" && (
        <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Platform pricing - edit live</h2>
          <p className="mt-1 text-xs text-muted-foreground">Change any price and save - it updates across the whole app instantly, no code changes.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["starter_price", "Starter plan (KSh/mo)"], ["pro_price", "Pro plan (KSh/mo)"], ["rider_sub_price", "Rider sub (KSh/mo)"], ["social_price", "Social (KSh/week)"], ["boost_price", "Boost ad (KSh)"], ["rider_fee_base", "Delivery base fare"], ["rider_fee_per_km", "Per-km fare"], ["rider_share_pct", "Rider share %"], ["starter_products", "Starter product cap"]].map((k) => (
              <div key={k[0]}><p className="text-xs font-semibold">{k[1]}</p><Input type="number" value={sForm[k[0]]} onChange={(e) => setSetForm({ ...sForm, [k[0]]: Number(e.target.value) })} /></div>
            ))}
          </div>
          <Button className="mt-4" onClick={saveSettings}>Save pricing</Button>
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
