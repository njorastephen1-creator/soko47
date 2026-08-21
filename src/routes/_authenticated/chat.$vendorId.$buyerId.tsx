import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/_authenticated/chat/$vendorId/$buyerId")({ component: ChatThread });
function ChatThread() {
  const { vendorId, buyerId } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const { data: msgs } = useQuery({
    queryKey: ["thread", vendorId, buyerId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendorId).eq("buyer_id", buyerId).order("created_at");
      return data || [];
    },
  });
  const { data: vendor } = useQuery({
    queryKey: ["chat-vendor", vendorId],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("shop_name, user_id").eq("id", vendorId).maybeSingle();
      return data;
    },
  });
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  if (!session) return null;
  const iAmVendor = vendor && vendor.user_id === session.user.id;
  const send = async () => {
    if (!body.trim()) return;
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? vendor.shop_name : (session.user.email || "Buyer"), body: body.trim() });
    setBody("");
    qc.invalidateQueries();
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 pt-8" style={{ height: "88vh" }}>
      <h1 className="font-display text-xl font-bold">{iAmVendor ? "Customer chat" : vendor ? vendor.shop_name : "Chat"}</h1>
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-3xl border border-border bg-card p-4">
        {(msgs || []).map((m: any) => (
          <div key={m.id} className={"flex " + (m.sender_id === session.user.id ? "justify-end" : "justify-start")}>
            <div className={"max-w-[75%] rounded-2xl px-3 py-2 text-sm " + (m.sender_id === session.user.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <p>{m.body}</p>
              <p className="mt-1 text-[10px] opacity-70">{m.sender_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {(msgs || []).length === 0 && <p className="text-center text-sm text-muted-foreground">Say habari! Start the conversation.</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 py-3">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <Button onClick={send}><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
