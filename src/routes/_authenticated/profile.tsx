import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });
function Profile() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const { vendor } = useMyVendor();
  const { data: prof } = useQuery({
    queryKey: ["my-profile", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  if (!session) return null;
  const baseName = vendor ? (vendor.display_name || vendor.shop_name) : (prof ? prof.display_name : (session.user.email || "").split("@")[0]);
  const basePhoto = vendor ? vendor.profile_image_url : prof ? prof.photo_url : null;
  const curName = name !== null ? name : baseName || "";
  const curPhoto = photo !== null ? photo : basePhoto || "";
  const curReply = reply !== null ? reply : vendor ? vendor.auto_reply || "" : "";
  const save = async () => {
    if (vendor) {
      const { error } = await supabase.from("vendors").update({ display_name: curName.trim() || null, profile_image_url: curPhoto || null, auto_reply: curReply.trim() || null }).eq("id", vendor.id);
      if (error) return toast.error(error.message);
    }
    const { error: e2 } = await supabase.from("user_profiles").upsert({ user_id: session.user.id, display_name: curName.trim() || null, photo_url: curPhoto || null });
    if (e2) return toast.error(e2.message);
    qc.invalidateQueries();
    toast.success("Profile saved - shows in all your chats");
  };
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><User className="size-7 text-accent" /> My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your name and photo as customers see them in chat.</p>
      <p className="mt-1 text-xs font-semibold text-success"><span className="inline-flex items-center gap-1"><Lock className="size-3.5" /> Private - only YOU can view & edit this page. Nobody else can touch your profile.</span></p>
      <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-3">
          {curPhoto ? <img src={curPhoto} alt="" className="size-28 rounded-full object-cover ring-4 ring-accent/20" /> : <span className="flex size-28 items-center justify-center rounded-full bg-accent/15 font-display text-4xl font-bold text-accent-deep">{(curName || "?").slice(0, 1).toUpperCase()}</span>}
          <ImageUpload value={curPhoto} onChange={(url: string) => setPhoto(url)} />
        </div>
        <div>
          <Label>Display name (choose anything you like)</Label>
          <Input value={curName} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Steve Persue Insurance" />
          {vendor ? <p className="mt-1 text-xs text-muted-foreground">Shop stays "{vendor.shop_name}" - this is your personal chat name.</p> : null}
        </div>
        {vendor ? (
          <div>
            <Label className="flex items-center gap-1"><Bot className="size-4" /> Auto-reply message</Label>
            <Textarea value={curReply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="e.g. Hey! Thanks for reaching out. I will reply within 10 minutes." maxLength={500} />
            <p className="mt-1 text-xs text-muted-foreground">Sent automatically when a new customer chats while you are away.</p>
          </div>
        ) : null}
        <Button className="w-full" onClick={save}>Save profile</Button>
      </div>
    </div>
  );
}
