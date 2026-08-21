import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function ChatFab() {
  const { session } = useSession();
  const { data: vendor } = useQuery({
    queryKey: ["fab-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  if (!session) return null;
  return (
    <Link to={vendor ? "/chats" : "/orders"} aria-label="Chats" className="fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-105 md:bottom-8 md:right-8">
      <MessageCircle className="size-6" />
    </Link>
  );
}
