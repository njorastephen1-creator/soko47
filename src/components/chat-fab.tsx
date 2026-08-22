import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
export function ChatFab() {
  const { session } = useSession();
  useEffect(() => {
    if (!session) return;
    const beat = () => { supabase.from("user_profiles").upsert({ user_id: session.user.id, last_seen: new Date().toISOString() }); };
    beat();
    const t = setInterval(beat, 60000);
    return () => clearInterval(t);
  }, [session]);
  const { session } = useSession();
  const { vendor } = useMyVendor();
  const { data: unread } = useQuery({
    queryKey: ["fab-unread", session ? session.user.id : "anon", vendor ? vendor.id : "none"],
    enabled: !!session,
    queryFn: async () => {
      if (vendor) {
        const { data } = await supabase.from("messages").select("id, sender_id, read_at").eq("vendor_id", vendor.id).is("read_at", null);
        return (data || []).filter((m: any) => m.sender_id !== vendor.user_id).length;
      }
      const { data } = await supabase.from("messages").select("id, sender_id, read_at").eq("buyer_id", session!.user.id).is("read_at", null);
      return (data || []).filter((m: any) => m.sender_id !== session!.user.id).length;
    },
  });
  if (!session) return null;
  const n = unread || 0;
  return (
    <Link to={vendor ? "/chats" : "/orders"} aria-label="Chats" className="fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-105 md:bottom-8 md:right-8">
      <MessageCircle className="size-6" />
      {n > 0 ? <span className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold">{n > 99 ? "99+" : n}</span> : null}
    </Link>
  );
}
