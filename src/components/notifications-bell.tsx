import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export function NotificationsBell() {
  const { session } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["notifications", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", session!.user.id).order("created_at", { ascending: false }).limit(12);
      return data || [];
    },
  });
  if (!session) return null;
  const unread = (data || []).filter(n => !n.read).length;
  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", session.user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-md px-2 py-1.5 hover:bg-primary" aria-label="Notifications">
        <Bell className="size-5" />
        {unread > 0 && <span className="warm-surface absolute -top-0.5 right-0 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">{unread}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && <button className="text-xs text-accent-deep underline" onClick={markAll}>Mark all read</button>}
        </div>
        {(data || []).length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">No notifications yet. Follow a shop to hear about new stock!</p>
        ) : (
          (data || []).map(n => (
            <DropdownMenuItem key={n.id} onClick={async () => {
              await supabase.from("notifications").update({ read: true }).eq("id", n.id);
              qc.invalidateQueries({ queryKey: ["notifications"] });
              navigate({ to: n.link });
            }}>
              <span className={"block w-full " + (n.read ? "opacity-70" : "")}>
                <span className="block text-sm font-medium">{n.title}</span>
                <span className="block text-xs text-muted-foreground">{n.body}</span>
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}