import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
export function FollowButton({ vendorId, className = "" }: { vendorId: string; className?: string }) {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data: following } = useQuery({
    queryKey: ["follow", vendorId, session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendor_follows").select("vendor_id").eq("user_id", session!.user.id).eq("vendor_id", vendorId).maybeSingle();
      return !!data;
    },
  });
  const toggle = async () => {
    if (!session) return toast.error("Sign in to follow shops");
    if (following) {
      await supabase.from("vendor_follows").delete().eq("user_id", session.user.id).eq("vendor_id", vendorId);
      toast.success("Unfollowed shop");
    } else {
      const { error } = await supabase.from("vendor_follows").insert({ user_id: session.user.id, vendor_id: vendorId });
      if (error) return toast.error(error.message);
      toast.success("Following! You'll be notified when they list new stock");
    }
    qc.invalidateQueries({ queryKey: ["follow", vendorId] });
  };
  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} className={className}>
      {following ? <><Check className="size-4" /> Following</> : <><BellRing className="size-4" /> Follow shop</>}
    </Button>
  );
}