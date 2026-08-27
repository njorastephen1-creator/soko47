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

export async function pickVendor(userId: string) {
  const { data: prof } = await supabase.from("user_profiles").select("active_vendor_id").eq("user_id", userId).maybeSingle();
  const { data: list } = await supabase.from("vendors").select("*").eq("user_id", userId);
  const arr = list || [];
  return arr.find((v: any) => v.id === (prof ? (prof as any).active_vendor_id : null)) || arr[0] || null;
}
