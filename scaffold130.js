import fs from 'fs';
const f = 'src/routes/_authenticated/admin.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1) Add trash query
if (!c.includes('adm-trash')) {
  c = c.split('  const { data: users } = useQuery(').join('  const { data: trash } = useQuery({ queryKey: ["adm-trash"], queryFn: async () => { const { data } = await supabase.from("trash").select("*").order("deleted_at", { ascending: false }); return data || []; } });\n  const { data: users } = useQuery(');
}

// 2) Add controlled delete helpers (confirm + trash) and restore/purge
if (!c.includes('toTrash')) {
  c = c.split('  const delVendor = async (id: string)').join(`  const toTrash = async (table: string, id: string, label: string) => {
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
  const delVendor = async (id: string)`);
}

// 3) Replace hard deletes with trash (confirm built into toTrash)
if (c.includes('const delProduct = async (id: string) => {\n    await supabase.from("products").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Listing removed");\n  };')) {
  c = c.split('const delProduct = async (id: string) => {\n    await supabase.from("products").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Listing removed");\n  };').join('const delProduct = async (id: string, label: string) => toTrash("products", id, label);');
}
if (c.includes('await supabase.from("vendors").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Shop deleted");')) {
  c = c.split('  const delVendor = async (id: string) => {\n    if (!window.confirm("Delete this shop and all its data?")) return;\n    await supabase.from("vendors").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Shop deleted");\n  };').join('  const delVendor = async (id: string, label: string) => toTrash("vendors", id, label);');
}
if (c.includes('await supabase.from("orders").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Order deleted");')) {
  c = c.split('  const delOrder = async (id: string) => {\n    if (!window.confirm("Delete this order?")) return;\n    await supabase.from("orders").delete().eq("id", id);\n    qc.invalidateQueries();\n    toast.success("Order deleted");\n  };').join('  const delOrder = async (id: string, label: string) => toTrash("orders", id, label);');
}

// 4) Add trash tab + product hide/show button
if (!c.includes('"trash"')) {
  c = c.split('const tabs = ["overview", "vendors", "listings", "orders", "users", "broadcast"];').join('const tabs = ["overview", "vendors", "listings", "orders", "users", "trash", "broadcast"];');
}
if (c.includes('onClick={() => delProduct(p.id)}')) {
  c = c.split('onClick={() => delProduct(p.id)}').join('onClick={() => delProduct(p.id, p.title)}');
  c = c.split('<Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p.id, p.title)}><Ban className="size-3.5" /> Remove</Button>').join('<Button size="sm" variant="outline" onClick={() => setProduct(p.id, { is_active: !p.is_active }, p.is_active ? "Listing hidden (suspended)" : "Listing live again")}><Ban className="size-3.5" /> {p.is_active ? "Hide" : "Show"}</Button>\n                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => delProduct(p.id, p.title)}><Ban className="size-3.5" /> Remove</Button>');
}
if (c.includes('onClick={() => delVendor(v.id)}')) {
  c = c.split('onClick={() => delVendor(v.id)}').join('onClick={() => delVendor(v.id, v.shop_name)}');
}
if (c.includes('onClick={() => delOrder(o.id)}')) {
  c = c.split('onClick={() => delOrder(o.id)}').join('onClick={() => delOrder(o.id, "order " + o.buyer_name)}');
}

// 5) Trash tab UI
if (!c.includes('{tab === "trash" && (')) {
  c = c.split('      {tab === "broadcast" && (').join(`      {tab === "trash" && (
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
      {tab === "broadcast" && (`);
}

fs.writeFileSync(f, c);
console.log('DONE: controlled admin with confirm + trash + restore + suspend');