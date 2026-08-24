import fs from 'fs';
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const pick = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return toast.error("Video too large - keep it under 50MB");
    setBusy(true);
    const path = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("videos").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast.success("Video uploaded");
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading..." : value ? "Change video" : "Upload video"}</Button>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
`);
console.log('DONE: video-upload.tsx created');