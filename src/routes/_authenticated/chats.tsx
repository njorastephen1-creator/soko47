import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export const Route = createFileRoute("/_authenticated/chats")({ component: ChatsInbox });
function ChatsInbox() {
  const { session } = useSession();
  const { data: vendor } = useQuery({
    queryKey: ["inbox-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, shop_name, profile_image_url, user_id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: allMsgs } = useQuery({
    queryKey: ["inbox-msgs", vendor ? vendor.id : session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      if (vendor) {
        const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
        return data || [];
      }
      const { data } = await supabase.from("messages").select("*, vendors(shop_name, profile_image_url)").eq("buyer_id", session!.user.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const threads: any = {};
  (allMsgs || []).forEach((m: any) => {
    const otherId = vendor ? m.sender_id : m.vendor_id;
    if (!threads[otherId]) {
      threads[otherId] = {
        otherId,
        vendorId: m.vendor_id,
        buyerId: vendor ? m.buyer_id : session!.user.id,
        name: vendor ? (m.sender_name || "Customer") : (m.vendors ? m.vendors.shop_name : "Trader"),
        photo: vendor ? null : (m.vendors ? m.vendors.profile_image_url : null),
        last: m.body,
        lastAt: m.created_at,
        unread: 0,
      };
    }
    const myId = vendor ? vendor.user_id : session!.user.id;
    if (m.sender_id !== myId && !m.read_at) threads[otherId].unread += 1;
  });
  const list = Object.values(threads).sort((a: any, b: any) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Chats</h1>
      <div className="mt-6 space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
        {list.map((t: any) => {
          const initial = (t.name || "?").slice(0, 1).toUpperCase();
          return (
            <Link key={t.otherId} to={"/chat/" + t.vendorId + "/" + t.buyerId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
              {t.photo ? <img src={t.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{initial}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{t.name}</p>
                  <p className="shrink-0 text-[11px] text-muted-foreground">{new Date(t.lastAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">{t.last}</p>
                  {t.unread > 0 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">{t.unread}</span> : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
