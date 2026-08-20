import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useLive() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("soko47-live")
      .on("postgres_changes", { event: "*", schema: "public" }, () => { qc.invalidateQueries(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}
