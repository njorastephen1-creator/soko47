import fs from 'fs';

// 1) Rewrite video-upload cleanly: remove dead XHR, add auth + type validation + user isolation
const vid = `import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
const MAX = 48 * 1024 * 1024;
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); toast.success("Video ready"); };
  const fail = (msg?: string) => { setBusy(false); toast.error(msg || "Upload failed. Try a shorter clip or paste a YouTube/Vimeo link."); };
  const pick = async (file: File) => {
    if (!session) return toast.error("Sign in to upload videos");
    if (!file.type.startsWith("video/")) return toast.error("Choose a video file");
    if (file.size > MAX) return toast.error("Your clip should not be more than 48MB till further notice. For longer videos, paste a YouTube/Vimeo link.");
    setBusy(true);
    const objectName = session.user.id.slice(0, 8) + "-vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const { error } = await supabase.storage.from("videos").upload(objectName, file, { contentType: file.type });
    if (error) { fail(error.message); return; }
    const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
    finish(data.publicUrl);
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading..." : value ? "Change video" : "Upload video"}</Button>
      <p className="mt-1 text-xs text-muted-foreground">Clips up to 48MB upload instantly. For longer videos, paste a YouTube/Vimeo link.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
`;
fs.writeFileSync('src/components/video-upload.tsx', vid);
console.log('video-upload.tsx rewritten (auth + type check + user isolation, dead XHR removed)');

// 2) Patch enrich: add type validation + user isolation to gallery + main video
const ef = 'src/routes/_authenticated/enrich.$id.tsx';
let e = fs.readFileSync(ef, 'utf8');
e = e.split('    if (!file) return;\n    if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");').join('    if (!file) return;\n    if (!file.type.startsWith("video/")) return toast.error("Choose a video file");\n    if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");');
e = e.split('      const path = "gal-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");').join('      const path = (session ? session.user.id.slice(0, 8) : "anon") + "-gal-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");');
fs.writeFileSync(ef, e);
console.log('enrich: type validation + user isolation added');