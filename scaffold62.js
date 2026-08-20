import fs from 'fs';
fs.writeFileSync('src/components/image-upload.tsx', `import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
function compress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1280;
      let w = img.width;
      let h = img.height;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("no canvas")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
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
    setBusy(true);
    try {
      const blob = await compress(file);
      if (blob.size > 4 * 1024 * 1024) { toast.error("Image too big even after compression"); return; }
      const path = (session ? session.user.id : "anon") + "-" + Date.now() + ".jpg";
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 60000));
      const up = supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
      const res: any = await Promise.race([up, timeout]);
      if (res && res.error) { toast.error("Upload failed: " + res.error.message); return; }
      const pub = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      onChange(pub);
      toast.success("Photo added");
    } catch {
      toast.error("Upload failed - check connection and try again");
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
console.log('DONE: compressed fast uploads');