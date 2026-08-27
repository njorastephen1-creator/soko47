import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(email: string | undefined) {
  const { data: ownerCheck } = useQuery({
    queryKey: ["owner-check", email],
    enabled: !!email,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { isOwner: false };
      const r = await fetch("/api/check-owner", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token }
      });
      return await r.json();
    },
  });
  
  const { data: adminRows } = useQuery({
    queryKey: ["admins-list"],
    enabled: !!email && !ownerCheck?.isOwner,
    queryFn: async () => {
      const { data } = await supabase.from("admins").select("email");
      return data || [];
    },
  });
  
  if (ownerCheck?.isOwner) return true;
  return !!(adminRows || []).find((a: any) => a.email.toLowerCase() === (email || "").toLowerCase());
}
