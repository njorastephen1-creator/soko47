import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });
function Profile() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [photo, setPhoto] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const { data: vendor } = useQuery({
    queryKey: ["profile-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, shop_name, profile_image_url, auto_reply").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  if (!vendor) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  const currentPhoto = photo || vendor.profile_image_url;
  const currentReply = photo === null && reply === "" && vendor.auto_reply ? vendor.auto_reply : reply;
  const save = async () => {
    const { error } = await supabase.from("vendors").update({ profile_image_url: currentPhoto, auto_reply: currentReply.trim() || null }).eq("id", vendor.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Profile saved");
  };
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><User className="size-7 text-accent" /> My profile</h1>
      <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-3">
          {currentPhoto ? <img src={currentPhoto} alt="" className="size-28 rounded-full object-cover ring-4 ring-accent/20" /> : <span className="flex size-28 items-center justify-center rounded-full bg-accent/15 font-display text-4xl font-bold text-accent-deep">{vendor.shop_name.slice(0, 1).toUpperCase()}</span>}
          <ImageUpload value={currentPhoto || ""} onChange={(url: string) => setPhoto(url)} />
        </div>
        <div>
          <Label>Shop name</Label>
          <Input value={vendor.shop_name} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Change shop name from the main dashboard.</p>
        </div>
        <div>
          <Label>🤖 Auto-reply message</Label>
          <Textarea value={currentReply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="e.g. Hey! Thanks for reaching out. I will reply within 10 minutes. For urgent orders, call the number on the shop." maxLength={500} />
          <p className="mt-1 text-xs text-muted-foreground">Sent automatically when a new customer chats and you are offline. Leave blank to disable.</p>
        </div>
        <Button className="w-full" onClick={save}>Save profile</Button>
      </div>
    </div>
  );
}
