import fs from 'fs';

fs.writeFileSync('src/components/image-upload.tsx', `import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

function compress(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 1280;
        let w = img.width;
        let h = img.height;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((b) => {
          URL.revokeObjectURL(url);
          if (!b || b.size >= file.size) { resolve(file); return; }
          resolve(new File([b], file.name.replace(/\\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.8);
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function ImageUpload({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image too big - max 8MB"); return; }
    setBusy(true);
    try {
      const small = await compress(file);
      const path = (session ? session.user.id : "anon") + "-" + Date.now() + "-" + small.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("product-images").upload(path, small, { contentType: small.type });
      if (error) { toast.error("Upload failed: " + error.message); return; }
      const pub = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      onChange(pub);
      toast.success("Photo added");
    } catch (err: any) {
      toast.error("Upload failed: " + (err && err.message ? err.message : "check connection and try again"));
    } finally {
      setBusy(false);
      input.value = "";
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
console.log('image-upload.tsx rewritten: browser compression + real error messages');