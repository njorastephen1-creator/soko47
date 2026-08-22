import fs from 'fs';
fs.writeFileSync('src/routes/social.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { stkPush, stkStatus } from "@/lib/mpesa";
export const Route = createFileRoute("/social")({ component: SocialPage });
function when(t: string) {
  const d = new Date(t);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
}
function SocialPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { vendor } = useMyVendor();
  const [kind, setKind] = useState("photo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const { data: myProf } = useQuery({
    queryKey: ["social-prof", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("display_name, social_expires_at").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: posts } = useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });
  const { data: allLikes } = useQuery({
    queryKey: ["social-likes"],
    queryFn: async () => { const { data } = await supabase.from("post_likes").select("post_id, user_id"); return data || []; },
  });
  const { data: mySaves } = useQuery({
    queryKey: ["social-saves", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => { const { data } = await supabase.from("post_saves").select("post_id").eq("user_id", session!.user.id); return data || []; },
  });
  const { data: comments } = useQuery({
    queryKey: ["social-comments"],
    queryFn: async () => { const { data } = await supabase.from("post_comments").select("*").order("created_at", { ascending: true }); return data || []; },
  });
  const socialActive = !!(myProf && myProf.social_expires_at && new Date(myProf.social_expires_at).getTime() > Date.now());
  const myName = myProf && myProf.display_name ? myProf.display_name : (session ? session.user.email.split("@")[0] : "");
  const likesCount: any = {};
  const myLikes: any = {};
  (allLikes || []).forEach((l: any) => {
    likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
    if (session && l.user_id === session.user.id) myLikes[l.post_id] = true;
  });
  const savedMap: any = {};
  (mySaves || []).forEach((s: any) => { savedMap[s.post_id] = true; });
  const commentsByPost: any = {};
  (comments || []).forEach((c: any) => { (commentsByPost[c.post_id] = commentsByPost[c.post_id] || []).push(c); });
  const paySocial = async () => {
    if (!payPhone.trim()) return toast.error("Enter your M-Pesa number");
    setPaying(true);
    try {
      const d = await stkPush(payPhone.trim(), 100, "SOCIAL-" + (session ? session.user.id.slice(0, 8) : "new"), myName);
      const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id);
      if (!invoice) throw new Error(d.error || "No invoice");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          await supabase.from("user_profiles").upsert({ user_id: session!.user.id, social_expires_at: new Date(Date.now() + 7 * 864e5).toISOString() });
          qc.invalidateQueries();
          toast.success("Social active for 7 days - post your first ad!");
          setPaying(false);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      toast.success("Still pending - check your M-Pesa messages.");
    } catch (e: any) { toast.error(String(e.message || e)); } finally { setPaying(false); }
  };
  const createPost = async () => {
    if (!session) return toast.error("Sign in to post");
    if (!socialActive) return toast.error("Activate the KSh 100/week social plan first");
    const url = kind === "photo" ? media : kind === "video" ? mediaUrl.trim() : "";
    if (!title.trim() && !body.trim() && !url) return toast.error("Add a title, text or media");
    const { error } = await supabase.from("posts").insert({ user_id: session.user.id, vendor_id: vendor ? vendor.id : null, kind, title: title.trim() || null, body: body.trim() || null, media_url: url || null, author_name: myName, author_shop: vendor ? vendor.shop_name : null });
    if (error) return toast.error(error.message);
    setTitle(""); setBody(""); setMedia(""); setMediaUrl("");
    qc.invalidateQueries();
    toast.success("Your ad is live on Soko47 Social!");
  };
  const toggleLike = async (id: string) => {
    if (!session) return toast.error("Sign in to like");
    if (myLikes[id]) await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id);
    else await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id });
    qc.invalidateQueries();
  };
  const toggleSave = async (id: string) => {
    if (!session) return toast.error("Sign in to save");
    if (savedMap[id]) await supabase.from("post_saves").delete().eq("post_id", id).eq("user_id", session.user.id);
    else await supabase.from("post_saves").insert({ post_id: id, user_id: session.user.id });
    qc.invalidateQueries();
    toast.success(savedMap[id] ? "Removed from favourites" : "Saved to favourites");
  };
  const share = async (p: any) => {
    const link = window.location.origin + "/social#" + p.id;
    if (navigator.share) { navigator.share({ title: p.title || "Soko47 Social", url: link }); }
    else { navigator.clipboard.writeText(link); toast.success("Link copied - share it anywhere"); }
  };
  const submitComment = async (postId: string, parentId: string | null) => {
    if (!session) return toast.error("Sign in to comment");
    const text = parentId ? replyBody : commentBody;
    if (!text.trim()) return toast.error("Write something first");
    await supabase.from("post_comments").insert({ post_id: postId, user_id: session.user.id, parent_id: parentId, body: text.trim(), author_name: myName });
    setCommentBody(""); setReplyBody(""); setReplyTo(null);
    qc.invalidateQueries();
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">Soko47 Social</h1>
      <p className="mt-1 text-sm text-muted-foreground">Business ads that move - videos, photos and stories from traders across Kenya. KSh 100/week to post.</p>
      {!session ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm">Sign in to like, comment, save and post your business ads.</div>
      ) : !socialActive ? (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <h2 className="font-semibold">Unlock posting - KSh 100/week</h2>
          <p className="mt-1 text-xs text-muted-foreground">Post unlimited video, photo and blog ads. Everyone can watch, like and comment for free.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input className="w-44" placeholder="M-Pesa phone e.g. 0712..." value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
            <Button onClick={paySocial} disabled={paying}>{paying ? "Waiting..." : "Activate - KSh 100/week"}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Post a business ad</h2>
          <div className="mt-2 flex gap-2">
            {["photo", "video", "blog"].map((k) => (<button key={k} onClick={() => setKind(k)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (kind === k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{k}</button>))}
          </div>
          <div className="mt-3 space-y-3">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fresh avocados this weekend!" /></div>
            <div><Label>Story / caption</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Tell buyers why they need it..." /></div>
            {kind === "photo" ? <div><Label>Photo</Label><ImageUpload value={media} onChange={(u) => setMedia(u)} /></div> : null}
            {kind === "video" ? <div><Label>Video link</Label><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://...mp4" /></div> : null}
            <Button onClick={createPost}>Post ad</Button>
          </div>
        </div>
      )}
      <div className="mt-6 space-y-4">
        {(posts || []).map((p: any) => (
          <div key={p.id} id={p.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{p.author_name}{p.author_shop ? " · " + p.author_shop : ""}</p>
              <span className="text-xs text-muted-foreground">{when(p.created_at)}</span>
            </div>
            {p.title ? <h3 className="mt-2 font-display text-lg font-bold">{p.title}</h3> : null}
            {p.body ? <p className="mt-1 text-sm text-muted-foreground">{p.body}</p> : null}
            {p.kind === "photo" && p.media_url ? <img src={p.media_url} alt={p.title || "ad"} className="mt-3 max-h-96 w-full rounded-xl object-cover" /> : null}
            {p.kind === "video" && p.media_url ? <video src={p.media_url} controls className="mt-3 max-w-[260px] rounded-xl border border-border" /> : null}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button onClick={() => toggleLike(p.id)} className={"flex items-center gap-1 " + (myLikes[p.id] ? "text-red-500" : "text-muted-foreground")}><Heart className={"size-4 " + (myLikes[p.id] ? "fill-red-500" : "")} /> {likesCount[p.id] || 0}</button>
              <button onClick={() => setOpenComments(openComments === p.id ? null : p.id)} className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="size-4" /> {(commentsByPost[p.id] || []).length}</button>
              <button onClick={() => toggleSave(p.id)} className={"flex items-center gap-1 " + (savedMap[p.id] ? "text-accent-deep" : "text-muted-foreground")}><Bookmark className={"size-4 " + (savedMap[p.id] ? "fill-accent" : "")} /> Save</button>
              <button onClick={() => share(p)} className="flex items-center gap-1 text-muted-foreground"><Share2 className="size-4" /> Share</button>
            </div>
            {openComments === p.id ? (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {(commentsByPost[p.id] || []).filter((c: any) => !c.parent_id).map((c: any) => (
                  <div key={c.id}>
                    <p className="text-xs font-semibold">{c.author_name} <span className="font-normal text-muted-foreground">· {when(c.created_at)}</span></p>
                    <p className="text-sm">{c.body}</p>
                    <button className="text-xs font-semibold text-accent-deep" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Reply</button>
                    {(commentsByPost[p.id] || []).filter((r: any) => r.parent_id === c.id).map((r: any) => (
                      <div key={r.id} className="ml-4 mt-1">
                        <p className="text-xs font-semibold">{r.author_name}</p>
                        <p className="text-sm">{r.body}</p>
                      </div>
                    ))}
                    {replyTo === c.id ? (
                      <div className="ml-4 mt-1 flex gap-2">
                        <Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Reply..." />
                        <Button size="sm" onClick={() => submitComment(p.id, c.id)}>Send</Button>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Write a comment..." />
                  <Button onClick={() => submitComment(p.id, null)}>Comment</Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {(posts || []).length === 0 && <p className="text-sm text-muted-foreground">No ads yet - be the first to post!</p>}
      </div>
    </div>
  );
}
`);
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('to="/social"')) {
  if (chrome.includes('Ride & earn</Link>')) {
    chrome = chrome.split('Ride & earn</Link>').join('Ride & earn</Link>\n            <Link to="/social" className="shrink-0 text-sm font-semibold text-white/90 hover:text-white">Social</Link>');
    fs.writeFileSync('src/components/site-chrome.tsx', chrome);
    console.log('Nav: Social link added');
  } else console.log('Nav anchor not found - page still at /social');
}
console.log('DONE: Soko47 Social live');