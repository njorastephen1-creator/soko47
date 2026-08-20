import fs from 'fs';
if (!fs.existsSync('src/lib')) fs.mkdirSync('src/lib', { recursive: true });
fs.writeFileSync('src/lib/mpesa.ts', `export async function stkPush(phone: string, amount: number, reference: string, name: string) {
  const r = await fetch("/api/stk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, amount, reference, name }) });
  const d = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(d.error || (d.details ? JSON.stringify(d.details) : "STK push failed (" + r.status + ")"));
  return d;
}
export async function stkStatus(invoice: string) {
  const r = await fetch("/api/stk-status?invoice=" + encodeURIComponent(invoice));
  return r.json().catch(() => ({} as any));
}
`);
console.log('Created mpesa lib');
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
if (!vendor.includes('from "@/lib/mpesa"')) {
  vendor = vendor.split('import { BadgeCheck, Package, Plus, Store, Users } from "lucide-react";').join('import { BadgeCheck, Package, Plus, Store, Users } from "lucide-react";\nimport { useState } from "react";\nimport { Input } from "@/components/ui/input";\nimport { stkPush, stkStatus } from "@/lib/mpesa";');
  n++;
}
if (!vendor.includes('const pendingCount = orderGroups.filter')) {
  vendor = vendor.split('</div>\n      </div>\n      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <h2 className="font-display text-xl font-bold">Your products</h2>').join('</div>\n      </div>\n      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>\n        <p className="mt-1 text-sm text-muted-foreground">KSh 300/month - your shop unlocks the second M-Pesa confirms.</p>\n        <div className="mt-3 flex flex-wrap items-center gap-2">\n          <Input className="w-44" placeholder="M-Pesa phone e.g. 0712..." value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />\n          <Button onClick={paySubscription} disabled={paying}>{paying ? "Waiting for PIN..." : "Pay KSh 300 with M-Pesa"}</Button>\n        </div>\n        {payMsg ? <p className="mt-2 text-xs font-semibold">{payMsg}</p> : null}\n      </div>\n      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <h2 className="font-display text-xl font-bold">Your products</h2>');
  n++;
}
if (!vendor.includes('const paySubscription = async')) {
  vendor = vendor.split('  if (!vendor) return (').join(`  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const paySubscription = async () => {
    if (!payPhone.trim()) return toast.error("Enter your M-Pesa phone number");
    setPaying(true);
    setPayMsg("Sending STK prompt - check your phone...");
    try {
      const d = await stkPush(payPhone.trim(), 300, "SUB-" + (vendor ? vendor.id.slice(0, 8) : "new"), vendor ? vendor.shop_name : "Soko47");
      const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id);
      if (!invoice) throw new Error(d.error || "No invoice from IntaSend");
      setPayMsg("Prompt sent - enter your M-Pesa PIN, then wait...");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          const exp = new Date(Date.now() + 30 * 864e5).toISOString();
          if (vendor) {
            await supabase.from("vendors").update({ subscription_plan: "monthly", subscription_expires_at: exp, status: "active" }).eq("id", vendor.id);
            qc.invalidateQueries();
          }
          toast.success("Payment received - shop unlocked for 30 days!");
          setPayMsg("PAID - asante for supporting Soko47!");
          setPaying(false);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      setPayMsg("Still pending - check your M-Pesa messages.");
    } catch (e: any) {
      toast.error(String(e.message || e));
      setPayMsg("");
    } finally { setPaying(false); }
  };
  if (!vendor) return (`);
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
console.log('DONE:', n, 'patches - M-Pesa card installed');