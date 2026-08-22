import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function useMyVendor() {
  const { session } = useSession();
  const { data: vendors, isLoading: loading } = useQuery({
    queryKey: ["my-vendors", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id);
      return data || [];
    },
  });
  const { data: prof } = useQuery({
    queryKey: ["active-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("active_vendor_id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const list = vendors || [];
  const vendor = list.find((v: any) => v.id === (prof ? prof.active_vendor_id : null)) || list[0] || null;
  return { vendor, vendors: list, loading };
}
