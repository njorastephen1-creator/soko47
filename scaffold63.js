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
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image too big - max 8MB"); return; }
    setBusy(true);
    try {
      const path = (session ? session.user.id : "anon") + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 90000));
      const up = supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
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
console.log('Uploader: direct file, no canvas, no black photos');
const pads = [
  ['src/routes/_authenticated/enrich.$id.tsx', '<div className="mx-auto max-w-2xl px-4 py-10">', '<div className="mx-auto max-w-2xl px-4 pb-28 pt-10 md:pb-10">'],
  ['src/routes/product.$id.tsx', '<div className="mx-auto max-w-6xl px-4 py-8">', '<div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">'],
  ['src/routes/browse.tsx', '<div className="mx-auto max-w-7xl px-4 py-8">', '<div className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:pb-8">']
];
for (const [file, oldS, newS] of pads) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes(oldS)) { c = c.split(oldS).join(newS); fs.writeFileSync(file, c); console.log('Scroll room added:', file); }
  else console.log('WARNING: container not found in', file);
}
console.log('DONE');