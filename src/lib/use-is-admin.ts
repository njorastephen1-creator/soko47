import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
export function useIsAdmin(email: string | undefined) {
  const isOwner = isAdminEmail(email || "");
  const { data } = useQuery({
    queryKey: ["admins-list"],
    enabled: !!email && !isOwner,
    queryFn: async () => { const { data } = await supabase.from("admins").select("email"); return data || []; },
  });
  if (isOwner) return true;
  return !!(data || []).find((a: any) => a.email === email);
}
