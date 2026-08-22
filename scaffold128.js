import fs from 'fs';

// Helper: add delete buttons to an order list with 20-day rule
function injectDeleteHelpers(c) {
  if (c.includes('canDeleteOrder')) return c;
  const helper = `
  const isAdmin = session && session.user.email === "njorastephen1@gmail.com";
  const canDeleteOrder = (g: any) => isAdmin || ((Date.now() - new Date(g.created_at).getTime()) >= 20 * 864e5);
  const canDeleteReceipt = (r: any) => isAdmin || ((Date.now() - new Date(r.created_at).getTime()) >= 20 * 864e5);
  const daysLeftOrder = (g: any) => Math.ceil(20 - (Date.now() - new Date(g.created_at).getTime()) / 864e5);
  const daysLeftReceipt = (r: any) => Math.ceil(20 - (Date.now() - new Date(r.created_at).getTime()) / 864e5);
  const deleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently? (Admin or 20+ days only)")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order deleted");
  };
  const deleteReceipt = async (id: string) => {
    if (!window.confirm("Delete this receipt permanently? (Admin or 20+ days only)")) return;
    const { error } = await supabase.from("receipts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Receipt deleted");
  };
`;
  c = c.split('import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";').join('import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";');
  if (!c.includes('Trash2')) {
    const m = c.match(/import \{([^}]+)\} from "lucide-react";/);
    if (m) c = c.replace(/import \{([^}]+)\} from "lucide-react";/, 'import {' + m[1].trim() + ', Trash2 } from "lucide-react";');
    else c = 'import { Trash2 } from "lucide-react";\n' + c;
  }
  c = c.split('  if (!myVendor) return').join(helper + '  if (!myVendor) return');
  return c;
}

// === POS ===
let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
p = injectDeleteHelpers(p);
// Delete button in order row
if (!p.includes('deleteOrder(g.id)')) {
  p = p.split('<div className="flex gap-2">\n                      {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}').join('<div className="flex gap-2">\n                      {canDeleteOrder(g) ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteOrder(g.id)}><Trash2 className="size-4" /></Button> : <span className="text-[11px] text-muted-foreground">Delete in {daysLeftOrder(g)}d</span>}\n                      {g.payment_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markStatus(g.id, { payment_status: "paid" })}>Mark paid</Button>}');
}
// Delete column in receipts table
if (!p.includes('deleteReceipt(r.id)')) {
  p = p.split('<th className="py-2 pr-2 text-right">Total</th>\n                    <th className="py-2" />').join('<th className="py-2 pr-2 text-right">Total</th>\n                    <th className="py-2 pr-2" />\n                    <th className="py-2" />');
  p = p.split('<td className="py-2 text-right text-xs font-semibold text-accent-deep">View</td>').join('<td className="py-2 text-right text-xs font-semibold text-accent-deep">View</td>\n                      <td className="py-2 text-right">{canDeleteReceipt(r) ? <button onClick={(e) => { e.stopPropagation(); deleteReceipt(r.id); }} className="text-destructive"><Trash2 className="size-3.5" /></button> : <span className="text-[10px] text-muted-foreground">{daysLeftReceipt(r)}d</span>}</td>');
}
fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
console.log('POS: delete buttons wired');

// === Vendor ===
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
v = injectDeleteHelpers(v);
if (!v.includes('deleteOrder(g.id)')) {
  v = v.split('<div className="flex flex-wrap gap-2">\n                    <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId"').join('<div className="flex flex-wrap gap-2">\n                    {canDeleteOrder(g) ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteOrder(g.id)}><Trash2 className="size-4" /></Button> : <span className="text-[11px] text-muted-foreground">Delete in {daysLeftOrder(g)}d</span>}\n                    <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId"');
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
console.log('Vendor: delete buttons wired');
console.log('DONE');