import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const DEFAULT_SETTINGS: any = { starter_price: 499, pro_price: 999, rider_sub_price: 300, social_price: 100, boost_price: 50, rider_fee_base: 100, rider_fee_per_km: 50, rider_share_pct: 90, starter_products: 100 };
export function useSettings() {
  const { data } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("settings").eq("id", 1).maybeSingle();
      return data ? { ...DEFAULT_SETTINGS, ...(data.settings || {}) } : DEFAULT_SETTINGS;
    },
  });
  return data || DEFAULT_SETTINGS;
}
