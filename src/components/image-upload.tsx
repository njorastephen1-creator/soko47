import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export function ImageUpload({ onUrl }: { onUrl: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 4 * 1024 * 1024) return toast.error("Image must be under 4MB");
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = "products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) { setBusy(false); return toast.error("Upload failed: " + error.message); }
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    setPreview(data.publicUrl);
    onUrl(data.publicUrl);
    setBusy(false);
    toast.success("Photo uploaded");
  };
  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {busy ? "Uploading..." : "Upload photo"}
      </Button>
      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="size-12 rounded-lg border border-border object-cover" />
          <button type="button" aria-label="Remove photo" onClick={() => { setPreview(null); onUrl(""); }} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="size-3" /></button>
        </div>
      )}
    </div>
  );
}