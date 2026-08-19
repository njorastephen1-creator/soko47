import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/enrich/$id")({ component: EnrichPage });
function EnrichPage() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: product } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors(user_id)").eq("id", id).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);
  const f = form || (product ? { condition: product.condition || "new", brand: product.brand || "", model: product.model || "", description: product.description || "", images: (product.images as string[]) || [], specs: (product.specs as any[]) || [] } : null);
  if (!product || !f) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  if (product.vendors && session && product.vendors.user_id !== session.user.id) return <p className="py-16 text-center text-muted-foreground">Only the shop owner can edit this listing.</p>;
  const save = async () => {
    const { error } = await supabase.from("products").update({ condition: f.condition, brand: f.brand.trim() || null, model: f.model.trim() || null, description: f.description, images: f.images, specs: f.specs.filter((s: any) => s.label && s.value) }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Listing enriched - buyers now see full details!");
    navigate({ to: "/product/$id", params: { id } });
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Add more info</h1>
      <p className="mt-1 text-sm text-muted-foreground">Richer listings sell faster - Jiji-style buyers love details.</p>
      <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Condition</Label>
            <select value={f.condition} onChange={(e) => setForm({ ...f, condition: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
              <option value="new">Brand new</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div><Label>Brand</Label><Input value={f.brand} onChange={(e) => setForm({ ...f, brand: e.target.value })} placeholder="e.g. HP" /></div>
          <div><Label>Model</Label><Input value={f.model} onChange={(e) => setForm({ ...f, model: e.target.value })} placeholder="e.g. EliteBook 840" /></div>
        </div>
        <div><Label>Full description</Label><Textarea rows={5} value={f.description} onChange={(e) => setForm({ ...f, description: e.target.value })} placeholder="Tell buyers everything: quality, size, warranty, why it's great..." /></div>
        <div>
          <Label>Extra photos</Label>
          <ImageUpload value="" onChange={(url: string) => setForm({ ...f, images: [...f.images, url] })} />
          <div className="mt-2 flex flex-wrap gap-2">
            {f.images.map((img: string, i: number) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="size-16 rounded-lg border border-border object-cover" />
                <button onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Key details (specs)</Label>
          <div className="mt-2 space-y-2">
            {f.specs.map((s: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={s.label} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, label: e.target.value } : x)) })} placeholder="e.g. RAM" />
                <Input value={s.value} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, value: e.target.value } : x)) })} placeholder="e.g. 8GB" />
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...f, specs: f.specs.filter((_: any, xi: number) => xi !== i) })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setForm({ ...f, specs: [...f.specs, { label: "", value: "" }] })}><Plus className="size-4" /> Add detail row</Button>
        </div>
        <Button size="lg" className="w-full" onClick={save}>Save & publish details</Button>
      </div>
    </div>
  );
}