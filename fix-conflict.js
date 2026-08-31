import fs from 'fs';

fs.writeFileSync('src/components/image-upload.tsx', `import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { compressImage } from "@/lib/compress-image";

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
      const small = await compressImage(file);
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
console.log('image-upload.tsx resolved with merge');