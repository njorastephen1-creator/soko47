import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const pick = async (file: File) => {
    if (file.size > 1024 * 1024 * 1024) return toast.error("Video too large - keep it under 1GB");
    setBusy(true);
    const path = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); return toast.error(String(error.message).includes("maximum allowed size") ? "Video too big for the current storage plan. Raise the limit in Supabase Dashboard > Storage, compress the clip, or paste a link instead." : error.message); }
    const { data } = supabase.storage.from("videos").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast.success("Video uploaded");
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading..." : value ? "Change video" : "Upload video"}</Button>
      <p className="mt-1 text-xs text-muted-foreground">Up to 1GB / long videos - if an upload is rejected, raise the storage limit in Supabase or paste a link.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
