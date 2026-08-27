import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Video } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const f = form || (product ? { condition: product.condition || "new", brand: product.brand || "", model: product.model || "", description: product.description || "", images: ([product.image_url].concat((product.images as string[]) || [])).filter(Boolean), specs: (product.specs as any[]) || [], video_url: product.video_url || "", highlights: (product.highlights as string[]) || [], faqs: (product.faqs as any[]) || [] } : null);
  if (!product || !f) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  if (product.vendors && session && product.vendors.user_id !== session.user.id) return <p className="py-16 text-center text-muted-foreground">Only the shop owner can edit this listing.</p>;
  const pickGalleryVideo = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return toast.error("Choose a video file");
    if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");
    setUploading(true);
    try {
      const path = (session ? session.user.id.slice(0, 8) : "anon") + "-gal-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (error) { toast.error(error.message); return; }
      const pub = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
      await addPhoto(pub);
      toast.success("Video added to gallery");
    } catch { toast.error("Could not upload video"); }
    finally { setUploading(false); }
  };
  const pickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return toast.error("Choose a video file");
    if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");
    setUploading(true);
    try {
      const dur = await new Promise<number>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
        v.onerror = () => reject(new Error("bad"));
        v.src = url;
      });
      
      const path = session!.user.id + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (error) { toast.error(error.message); return; }
      const pub = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
      setForm({ ...f, video_url: pub });
      toast.success("Video attached (" + Math.round(dur) + "s)");
    } catch { toast.error("Could not read that video file"); }
    finally { setUploading(false); }
  };
  const persistImages = async (next: string[]) => {
    const { error } = await supabase.from("products").update({ image_url: next[0] || null, images: next.slice(1) }).eq("id", id);
    if (error) { toast.error("Photo save failed: " + error.message); return false; }
    qc.invalidateQueries();
    return true;
  };
  const addPhoto = async (url: string) => {
    const next = [...f.images, url];
    setForm({ ...f, images: next });
    if (await persistImages(next)) toast.success("Photo saved to listing");
  };
  const removePhoto = async (i: number) => {
    const next = f.images.filter((_: string, x: number) => x !== i);
    if (next.length === 0) { toast.error("Keep at least one photo"); return; }
    setForm({ ...f, images: next });
    if (await persistImages(next)) toast.success("Photo removed");
  };
  const save = async () => {
    if (!f.images || f.images.length === 0) return toast.error("Keep at least one photo");
    const { error } = await supabase.from("products").update({
      condition: f.condition,
      brand: f.brand.trim() || null,
      model: f.model.trim() || null,
      description: f.description,
      image_url: f.images[0] || null,
      images: f.images.slice(1),
      specs: f.specs.filter((s: any) => s.label && s.value),
      video_url: f.video_url.trim() || null,
      highlights: f.highlights.filter((h: string) => h.trim()),
      faqs: f.faqs.filter((x: any) => x.q && x.a)
    }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Listing enriched - full live!");
    navigate({ to: "/product/$id", params: { id } });
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-10 md:pb-10">
      <h1 className="font-display text-3xl font-bold">Add more info</h1>
      <p className="mt-1 text-sm text-muted-foreground">Richer listings sell faster - buyers love details, videos and answers.</p>
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
          <Label>Product photos (first = cover)</Label>
          <p className="text-[11px] text-muted-foreground">Photos save instantly as you upload - buyers see them right away.</p>
          <ImageUpload value="" onChange={addPhoto} />
          <div className="mt-2 flex flex-wrap gap-2">
            {f.images.map((img: string, i: number) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="size-16 rounded-lg border border-border object-cover" />
                {i === 0 && <span className="absolute bottom-0 left-0 rounded-tr bg-primary px-1 text-[8px] font-bold text-primary-foreground">MAIN</span>}
                <button onClick={() => removePhoto(i)} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="flex items-center gap-1"><Video className="size-4" /> Product video (max 1 min 30 sec)</Label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
              {uploading ? "Uploading..." : "Upload video"}
              <input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />
        <Button type="button" variant="outline" className="mt-2" onClick={() => (document.getElementById("galvid") as HTMLInputElement)?.click()}>{uploading ? "Uploading..." : "Add video to gallery"}</Button>
        <input id="galvid" type="file" accept="video/*" className="hidden" onChange={pickGalleryVideo} disabled={uploading} />
            </label>
            <span className="text-[11px] text-muted-foreground">or paste a YouTube/mp4 link</span>
          </div>
          <Input className="mt-2" value={f.video_url} onChange={(e) => setForm({ ...f, video_url: e.target.value })} placeholder="Video link (optional if you uploaded)" />
          {f.video_url ? <p className="mt-1 truncate text-[11px] text-success">Video attached: {f.video_url}</p> : null}
        </div>
        <div>
          <Label>About this item (bullet points)</Label>
          <div className="mt-2 space-y-2">
            {f.highlights.map((h: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={h} onChange={(e) => setForm({ ...f, highlights: f.highlights.map((x: string, xi: number) => (xi === i ? e.target.value : x)) })} placeholder="e.g. 7-piece set - comforter, sheets & shams" />
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...f, highlights: f.highlights.filter((_: string, xi: number) => xi !== i) })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setForm({ ...f, highlights: [...f.highlights, ""] })}><Plus className="size-4" /> Add bullet</Button>
        </div>
        <div>
          <Label>Key details (specs)</Label>
          <div className="mt-2 space-y-2">
            {f.specs.map((s: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={s.label} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, label: e.target.value } : x)) })} placeholder="What is it? e.g. Material / Size / RAM" />
                <Input value={s.value} onChange={(e) => setForm({ ...f, specs: f.specs.map((x: any, xi: number) => (xi === i ? { ...x, value: e.target.value } : x)) })} placeholder="The detail e.g. Cotton / Large / 8GB" />
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...f, specs: f.specs.filter((_: any, xi: number) => xi !== i) })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setForm({ ...f, specs: [...f.specs, { label: "", value: "" }] })}><Plus className="size-4" /> Add detail row</Button>
        </div>
        <div>
          <Label>Frequently asked questions (you write Q & A)</Label>
          <div className="mt-2 space-y-3">
            {f.faqs.map((x: any, i: number) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="flex gap-2">
                  <Input value={x.q} onChange={(e) => setForm({ ...f, faqs: f.faqs.map((y: any, yi: number) => (yi === i ? { ...y, q: e.target.value } : y)) })} placeholder="Question e.g. Is delivery same-day?" />
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...f, faqs: f.faqs.filter((_: any, yi: number) => yi !== i) })}><Trash2 className="size-4" /></Button>
                </div>
                <Textarea className="mt-2" rows={2} value={x.a} onChange={(e) => setForm({ ...f, faqs: f.faqs.map((y: any, yi: number) => (yi === i ? { ...y, a: e.target.value } : y)) })} placeholder="Your answer..." />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setForm({ ...f, faqs: [...f.faqs, { q: "", a: "" }] })}><Plus className="size-4" /> Add FAQ</Button>
        </div>
        <Button size="lg" className="w-full" onClick={save}>Save & publish details</Button>
      </div>
    </div>
  );
}
