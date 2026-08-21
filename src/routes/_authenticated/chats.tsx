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
      const { data } = await supabase.from("vendors").select("id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: msgs } = useQuery({
    queryKey: ["inbox-msgs", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });
  const threads: any[] = [];
  (msgs || []).forEach((m: any) => {
    if (!threads.find((t) => t.buyer_id === m.buyer_id)) threads.push(m);
  });
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Customer chats</h1>
      <div className="mt-6 space-y-2">
        {threads.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet - buyers can chat you from any product page.</p>}
        {threads.map((t: any) => (
          <Link key={t.buyer_id} to="/chat/$vendorId/$buyerId" params={{ vendorId: t.vendor_id, buyerId: t.buyer_id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{(t.sender_name || "?").slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.sender_name || "Customer"}</p>
              <p className="truncate text-xs text-muted-foreground">{t.body}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
