import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
if (!v.includes('Add a product')) {
  if (!v.includes('import { ImageUpload }')) v = v.split('import { Button } from "@/components/ui/button";').join('import { Button } from "@/components/ui/button";\nimport { ImageUpload } from "@/components/image-upload";');
  if (!v.includes('import { Textarea }')) v = v.split('import { ImageUpload } from "@/components/image-upload";').join('import { ImageUpload } from "@/components/image-upload";\nimport { Textarea } from "@/components/ui/textarea";');
  if (!v.includes('import { Label }')) v = v.split('import { Input } from "@/components/ui/input";').join('import { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";');
  v = v.split('  const [offers, setOffers] = useState<any>({});').join(`  const [offers, setOffers] = useState<any>({});
  const [np, setNp] = useState<any>({ title: "", price: "", stock: "", category: "produce", unit: "piece", image: "", desc: "" });
  const addProduct = async () => {
    if (!vendor) return;
    if (np.title.trim().length < 2) return toast.error("Give the product a name");
    const price = Number(np.price);
    if (!price || price <= 0) return toast.error("Set a selling price");
    const { error } = await supabase.from("products").insert({ vendor_id: vendor.id, title: np.title.trim(), price_kes: price, stock: Number(np.stock) || 0, category_slug: np.category, unit: np.unit || "piece", image_url: np.image || null, description: np.desc.trim() || null, is_active: true });
    if (error) return toast.error(error.message);
    setNp({ title: "", price: "", stock: "", category: "produce", unit: "piece", image: "", desc: "" });
    qc.invalidateQueries();
    toast.success("Product live on the market!");
  };`);
  v = v.split('      <div className="mt-6 rounded-3xl border border-border bg-card p-6">\n        <div className="flex flex-wrap items-center justify-between gap-2">\n          <h2 className="font-display text-xl font-bold">Your products</h2>').join(`      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">➕ Add a product</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label>Product name</Label><Input value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} placeholder="e.g. Fresh tomatoes (kiondo)" /></div>
          <div><Label>Price (KSh)</Label><Input type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="250" /></div>
          <div><Label>Stock</Label><Input type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} placeholder="40" /></div>
          <div><Label>Category</Label>
            <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" value={np.category} onChange={(e) => setNp({ ...np, category: e.target.value })}>
              <option value="produce">Fresh Produce</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="household">Household</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Photo</Label><ImageUpload value={np.image} onChange={(url: string) => setNp({ ...np, image: url })} /></div>
          <div className="sm:col-span-2"><Label>Description (optional)</Label><Textarea value={np.desc} onChange={(e) => setNp({ ...np, desc: e.target.value })} rows={2} placeholder="Size, quality, where it comes from..." /></div>
        </div>
        <Button className="mt-3" onClick={addProduct}>Put on the market</Button>
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Your products</h2>`);
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
console.log('DONE:', n, 'add-product form restored');