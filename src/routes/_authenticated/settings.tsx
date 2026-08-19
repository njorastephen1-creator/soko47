import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });
function SettingsPage() {
  const { session } = useSession();
  const [name, setName] = useState((session?.user_metadata?.full_name as string) || "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const saveName = async () => {
    if (name.trim().length < 2) return toast.error("Enter your full name");
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error) return toast.error(error.message);
    toast.success("Name updated!");
  };
  const savePw = async () => {
    if (pw.length < 6) return toast.error("Password must be 6+ characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    setPw(""); setPw2("");
    toast.success("Password changed! Use it next time you sign in.");
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Account settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {session?.user?.email}</p>
      <div className="mt-6 space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="flex items-center gap-2 font-display font-bold"><UserCog className="size-5 text-accent-deep" /> Display name</p>
          <div className="mt-4 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stephen Njora" />
            <Button onClick={saveName}>Save</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">This name appears in the header, notifications and your shop.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="flex items-center gap-2 font-display font-bold"><KeyRound className="size-5 text-accent-deep" /> Change password</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div><Label>Repeat new password</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          </div>
          <Button className="mt-4" onClick={savePw}>Change password</Button>
          <p className="mt-2 text-xs text-muted-foreground">Change it anytime while signed in - no reset email needed.</p>
        </div>
      </div>
    </div>
  );
}
