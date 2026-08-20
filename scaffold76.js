import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
if (!vendor.includes('Subscription - M-Pesa')) {
  vendor = vendor.split('      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <h2 className="font-display text-xl font-bold">Incoming orders</h2>').join(`      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>
        <p className="mt-1 text-sm text-muted-foreground">KSh 300/month to Soko47 - your shop unlocks the second M-Pesa confirms.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="w-44" placeholder="M-Pesa phone e.g. 0712..." value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
          <Button onClick={paySubscription} disabled={paying}>{paying ? "Waiting for PIN..." : "Pay KSh 300 with M-Pesa"}</Button>
        </div>
        {payMsg ? <p className="mt-2 text-xs font-semibold">{payMsg}</p> : null}
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Receive payments YOUR way</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customer money goes straight to YOU - Soko47 never touches it.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><Label>Your M-Pesa number</Label><Input value={rr ? rr.phone : ""} onChange={(e) => setRails({ ...rr, phone: e.target.value })} placeholder="0712..." /></div>
          <div><Label>Till / Business no. (optional)</Label><Input value={rr ? rr.till : ""} onChange={(e) => setRails({ ...rr, till: e.target.value })} placeholder="e.g. 123456" /></div>
          <div><Label>Your own IntaSend key (optional)</Label><Input value={rr ? rr.pub : ""} onChange={(e) => setRails({ ...rr, pub: e.target.value })} placeholder="ISPubKey_live_..." /></div>
        </div>
        <Button className="mt-3" onClick={saveRails}>Save payment details</Button>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Incoming orders</h2>`);
  n++;
}
if (!vendor.includes('const saveRails')) {
  vendor = vendor.split('import { Input } from "@/components/ui/input";').join('import { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";');
  vendor = vendor.split('  const [payPhone, setPayPhone] = useState("");').join('  const [payPhone, setPayPhone] = useState("");\n  const [rails, setRails] = useState<any>(null);\n  const rr = rails || (vendor ? { phone: vendor.pay_phone || "", till: vendor.till_number || "", pub: vendor.intasend_publishable || "" } : null);\n  const saveRails = async () => {\n    if (!vendor) return;\n    const { error } = await supabase.from("vendors").update({ pay_phone: rr.phone.trim() || null, till_number: rr.till.trim() || null, intasend_publishable: rr.pub.trim() || null }).eq("id", vendor.id);\n    if (error) return toast.error(error.message);\n    qc.invalidateQueries();\n    toast.success("Payment details saved - customers can now pay YOU directly");\n  };');
  n++;
}
if (vendor.includes('vendor.status === "blocked"')) {
  vendor = vendor.split('vendor.status === "blocked"').join('(vendor.status === "blocked" || vendor.status === "suspended")');
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
console.log('Vendor patches:', n);
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
let m = 0;
if (!prod.includes('pay_phone')) {
  prod = prod.split('vendors!inner(id, user_id, shop_name, slug, county_slug, market_name, phone, whatsapp, followers_count, status, rating_sum, rating_count)').join('vendors!inner(id, user_id, shop_name, slug, county_slug, market_name, phone, whatsapp, pay_phone, till_number, followers_count, status, rating_sum, rating_count)');
  prod = prod.split('{product.vendors.whatsapp ? <a href={"https://wa.me/" + product.vendors.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><MessageCircle className="size-3.5" /> WhatsApp</a> : null}').join('{product.vendors.whatsapp ? <a href={"https://wa.me/" + product.vendors.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><MessageCircle className="size-3.5" /> WhatsApp</a> : null}\n              {product.vendors.pay_phone ? <button onClick={() => { navigator.clipboard.writeText(product.vendors.pay_phone); toast.success("M-Pesa number copied - pay " + product.vendors.shop_name + " directly"); }} className="flex items-center gap-1 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-deep">💳 M-Pesa: {product.vendors.pay_phone} (tap to copy)</button> : null}');
  m++;
}
if (m > 0) { fs.writeFileSync('src/routes/product.$id.tsx', prod); console.log('Product page: direct-pay chip'); }
console.log('DONE');