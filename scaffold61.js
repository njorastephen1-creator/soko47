import fs from 'fs';
fs.writeFileSync('src/components/image-upload.tsx', `import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function ImageUpload({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too big - max 5MB"); return; }
    setBusy(true);
    try {
      const path = (session ? session.user.id : "anon") + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) { toast.error("Upload failed: " + error.message); return; }
      const pub = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      onChange(pub);
      toast.success("Photo added");
    } catch (err: any) {
      toast.error("Upload failed - check your connection and try again");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
      <Upload className="size-4" /> {busy ? "Uploading..." : "Upload photo"}
      <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
    </label>
  );
}
`);
console.log('Created rock-solid image uploader');
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (prod.includes('<div className="overflow-hidden rounded-3xl border border-border bg-black">') && !prod.includes('Close video')) {
  prod = prod.split(`          ) : (
            <div className="overflow-hidden rounded-3xl border border-border bg-black">
              {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
            </div>
          )}`).join(`          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Product video</h2>
                <button onClick={() => setShowVideo(false)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Close video</button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-black">
                {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
              </div>
            </div>
          )}`);
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Patched: close video button');
} else console.log('video block already ok or not found');
console.log('DONE');