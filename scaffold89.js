import fs from 'fs';
let iu = fs.readFileSync('src/components/image-upload.tsx', 'utf8');
let bucket = 'product-images';
const bm = iu.match(/storage\.from\(["']([^"']+)["']\)/);
if (bm) bucket = bm[1];
console.log('Using bucket:', bucket);
fs.writeFileSync('src/components/chat-fab.tsx', `import { Link } from "@tanstack/react-router";
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
`);
fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
  const [attach, setAttach] = useState<{ url: string; type: string } | null>(null);
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
  const onFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB - short videos & photos only");
    const path = "chat/" + Date.now() + "_" + f.name.replace(/[^a-zA-Z0-9.]+/g, "_");
    const { error } = await supabase.storage.from("${bucket}").upload(path, f);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("${bucket}").getPublicUrl(path);
    setAttach({ url: data.publicUrl, type: f.type.startsWith("video") ? "video" : "image" });
    toast.success("Attached - now hit send");
  };
  const send = async () => {
    if (!body.trim() && !attach) return;
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? vendor.shop_name : (session.user.email || "Buyer"), body: body.trim() || (attach ? (attach.type === "video" ? "🎥 Video" : "📷 Photo") : ""), attachment_url: attach ? attach.url : null, attachment_type: attach ? attach.type : null });
    setBody("");
    setAttach(null);
    qc.invalidateQueries();
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }}>
      <div className="flex items-center gap-3 rounded-t-2xl bg-[#075E54] p-3 text-white">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/20 font-display font-bold">{(vendor ? vendor.shop_name : "C").slice(0, 1)}</span>
        <div>
          <p className="font-semibold">{iAmVendor ? "Customer" : vendor ? vendor.shop_name : "Chat"}</p>
          <p className="text-[11px] opacity-80">Soko47 chat · photos & short videos</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ backgroundColor: "#efeae2", backgroundImage: "radial-gradient(#d8d2c6 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {(msgs || []).map((m: any) => (
          <div key={m.id} className={"flex " + (m.sender_id === session.user.id ? "justify-end" : "justify-start")}>
            <div className={"max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm " + (m.sender_id === session.user.id ? "bg-[#d9fdd3]" : "bg-white")}>
              {m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" className="mb-1 max-h-64 rounded-lg" /> : null}
              {m.attachment_url && m.attachment_type === "video" ? <video src={m.attachment_url} controls className="mb-1 max-h-64 rounded-lg" /> : null}
              <p>{m.body}</p>
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {(msgs || []).length === 0 && <p className="pt-10 text-center text-sm text-muted-foreground">🔒 Messages are between you and the trader only. Say habari!</p>}
        <div ref={endRef} />
      </div>
      <div className="rounded-b-2xl bg-[#f0f2f5] p-2">
        {attach ? <div className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-xs"><span className="flex-1 truncate">{attach.type === "video" ? "🎥 Video ready" : "📷 Photo ready"}</span><button onClick={() => setAttach(null)}><X className="size-4 text-destructive" /></button></div> : null}
        <div className="flex items-center gap-2">
          <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white shadow">
            <Paperclip className="size-5 text-[#075E54]" />
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
          </label>
          <Input className="rounded-full bg-white" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message" onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <Button onClick={send} className="size-11 shrink-0 rounded-full bg-[#25D366] p-0 hover:bg-[#1ebe5b]"><Send className="size-5" /></Button>
        </div>
      </div>
    </div>
  );
}
`);
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('ChatFab')) {
  chrome = chrome.split('import { HomeAds } from "@/components/home-ads";').join('import { HomeAds } from "@/components/home-ads";\nimport { ChatFab } from "@/components/chat-fab";');
  chrome = chrome.split('</header>').join('<ChatFab /></header>');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Chat FAB visible everywhere');
}
console.log('DONE: WhatsApp-style chat');