import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, Eye, Flag, Heart, MessageCircle, Share2, Store, Trash2, UserCheck, UserPlus, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
import { isAdminEmail } from "@/lib/admin";
import { useSettings } from "@/lib/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { stkPush, stkStatus } from "@/lib/mpesa";
export const Route = createFileRoute("/social")({ component: SocialPage });
function when(t: string) { const d = new Date(t); const now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); return d.toLocaleDateString(); }
function tagsOf(p: any) { return String(p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean); }
function boosted(p: any) { return !!(p.boosted_until && new Date(p.boosted_until).getTime() > Date.now()); }
function SocialPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { vendor } = useMyVendor();
  const isAdm = isAdminEmail(session ? session.user.email : "");
  const settings = useSettings();
  const [kind, setKind] = useState("photo");
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [tags, setTags] = useState("");
  const [media, setMedia] = useState(""); const [mediaUrl, setMediaUrl] = useState("");
  const [payPhone, setPayPhone] = useState(""); const [paying, setPaying] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState(""); const [replyTo, setReplyTo] = useState<string | null>(null); const [replyBody, setReplyBody] = useState("");
  const [activeTag, setActiveTag] = useState(""); const [search, setSearch] = useState(""); const [sort, setSort] = useState("newest"); const [feedTab, setFeedTab] = useState("foryou");
  const [showForm, setShowForm] = useState(false);
  const { data: myProf } = useQuery({ queryKey: ["social-prof", session ? session.user.id : "anon"], enabled: !!session, queryFn: async () => { const { data } = await supabase.from("user_profiles").select("display_name, social_expires_at").eq("user_id", session!.user.id).maybeSingle(); return data || null; } });
  const { data: posts } = useQuery({ queryKey: ["social-posts"], queryFn: async () => { const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: allLikes } = useQuery({ queryKey: ["social-likes"], queryFn: async () => { const { data } = await supabase.from("post_likes").select("post_id, user_id"); return data || []; } });
  const { data: allViews } = useQuery({ queryKey: ["social-views"], queryFn: async () => { const { data } = await supabase.from("post_views").select("post_id"); return data || []; } });
  const { data: mySaves } = useQuery({ queryKey: ["social-saves", session ? session.user.id : "anon"], enabled: !!session, queryFn: async () => { const { data } = await supabase.from("post_saves").select("post_id").eq("user_id", session!.user.id); return data || []; } });
  const { data: myFollows } = useQuery({ queryKey: ["social-follows", session ? session.user.id : "anon"], enabled: !!session, queryFn: async () => { const { data } = await supabase.from("post_follows").select("author_id").eq("follower_id", session!.user.id); return data || []; } });
  const { data: comments } = useQuery({ queryKey: ["social-comments"], queryFn: async () => { const { data } = await supabase.from("post_comments").select("*").order("created_at", { ascending: true }); return data || []; } });
  const socialActive = isAdm || !!(myProf && myProf.social_expires_at && new Date(myProf.social_expires_at).getTime() > Date.now());
  const myName = myProf && myProf.display_name ? myProf.display_name : (session ? session.user.email.split("@")[0] : "");
  const likesCount: any = {}; const myLikes: any = {};
  (allLikes || []).forEach((l: any) => { likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1; if (session && l.user_id === session.user.id) myLikes[l.post_id] = true; });
  const viewsCount: any = {}; (allViews || []).forEach((v: any) => { viewsCount[v.post_id] = (viewsCount[v.post_id] || 0) + 1; });
  const savedMap: any = {}; (mySaves || []).forEach((s: any) => { savedMap[s.post_id] = true; });
  const followSet: any = {}; (myFollows || []).forEach((f: any) => { followSet[f.author_id] = true; });
  const commentsByPost: any = {}; (comments || []).forEach((c: any) => { (commentsByPost[c.post_id] = commentsByPost[c.post_id] || []).push(c); });
  const tagCounts: any = {}; (posts || []).forEach((p: any) => tagsOf(p).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const popularTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 8);
  let feed = (posts || []).filter((p: any) => !p.expires_at || new Date(p.expires_at).getTime() > Date.now());
  if (feedTab === "following") feed = feed.filter((p: any) => followSet[p.user_id]);
  if (activeTag) feed = feed.filter((p: any) => tagsOf(p).map((t: string) => t.toLowerCase()).includes(activeTag.toLowerCase()));
  if (search.trim()) feed = feed.filter((p: any) => ((p.title || "") + " " + (p.body || "") + " " + (p.tags || "")).toLowerCase().includes(search.toLowerCase()));
  feed.sort((a: any, b: any) => { const ab = boosted(a) ? 1 : 0; const bb = boosted(b) ? 1 : 0; if (ab !== bb) return bb - ab; if (sort === "trending") return (likesCount[b.id] || 0) - (likesCount[a.id] || 0); return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
  const paySocial = async () => { if (!payPhone.trim()) return toast.error("Enter your M-Pesa number"); setPaying(true); try { const d = await stkPush(payPhone.trim(), Number(settings.social_price), "SOCIAL-" + (session ? session.user.id.slice(0, 8) : "new"), myName); const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id); if (!invoice) throw new Error(d.error || "No invoice"); for (let i = 0; i < 30; i++) { await new Promise((r2) => setTimeout(r2, 4000)); const s = await stkStatus(invoice); const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase(); if (["complete", "completed", "paid", "success"].includes(state)) { await supabase.from("user_profiles").upsert({ user_id: session!.user.id, social_expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }); qc.invalidateQueries(); toast.success("Social active for 7 days!"); setPaying(false); return; } if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state); } toast.success("Still pending - check M-Pesa."); } catch (e: any) { toast.error(String(e.message || e)); } finally { setPaying(false); } };
  const createPost = async () => { if (!session) return toast.error("Sign in to post"); if (!socialActive) return toast.error("Activate the KSh 100/week plan first"); const url = kind === "photo" ? media : kind === "video" ? mediaUrl.trim() : ""; if (!title.trim() && !desc.trim() && !url) return toast.error("Add a title, description or media"); const { error } = await supabase.from("posts").insert({ user_id: session.user.id, vendor_id: vendor ? vendor.id : null, kind, title: title.trim() || null, body: desc.trim() || null, tags: tags.trim() || null, media_url: url || null, author_name: myName, author_shop: vendor ? vendor.shop_name : null, author_shop_slug: vendor ? vendor.slug : null, author_verified: isAdm || !!(vendor && (vendor.subscription_plan === "pro" || vendor.status === "active")), expires_at: kind === "story" ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null }); if (error) return toast.error(error.message); setTitle(""); setDesc(""); setTags(""); setMedia(""); setMediaUrl(""); setShowForm(false); qc.invalidateQueries(); toast.success(kind === "story" ? "Story live for 24 hours!" : "Your ad is live!"); };
  const toggleLike = async (id: string) => { if (!session) return toast.error("Sign in to like"); if (myLikes[id]) await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id); else await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); };
  const toggleSave = async (id: string) => { if (!session) return toast.error("Sign in to save"); if (savedMap[id]) await supabase.from("post_saves").delete().eq("post_id", id).eq("user_id", session.user.id); else await supabase.from("post_saves").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); };
  const toggleFollow = async (authorId: string) => { if (!session) return toast.error("Sign in to follow"); if (followSet[authorId]) await supabase.from("post_follows").delete().eq("follower_id", session.user.id).eq("author_id", authorId); else await supabase.from("post_follows").insert({ follower_id: session.user.id, author_id: authorId }); qc.invalidateQueries(); };
  const recordView = async (id: string) => { if (!session) return; const { data } = await supabase.from("post_views").select("post_id").eq("post_id", id).eq("user_id", session.user.id).maybeSingle(); if (!data) { await supabase.from("post_views").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); } };
  const share = async (p: any) => { const link = window.location.origin + "/social#" + p.id; if (navigator.share) navigator.share({ title: p.title || "Soko47 Social", url: link }); else { navigator.clipboard.writeText(link); toast.success("Link copied"); } };
  const report = async (p: any) => { if (!session) return toast.error("Sign in to report"); const reason = window.prompt("Why are you reporting this ad?"); if (!reason) return; await supabase.from("post_reports").insert({ post_id: p.id, reporter_id: session.user.id, reason }); toast.success("Reported - our team will review"); };
  const boost = async (p: any) => { if (!session) return; setPaying(true); try { const d = await stkPush(payPhone.trim() || "254700000000", Number(settings.boost_price), "BOOST-" + p.id.slice(0, 8), myName); const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id); if (!invoice) throw new Error(d.error || "No invoice"); for (let i = 0; i < 20; i++) { await new Promise((r2) => setTimeout(r2, 4000)); const s = await stkStatus(invoice); const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase(); if (["complete", "completed", "paid", "success"].includes(state)) { await supabase.from("posts").update({ boosted_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString() }).eq("id", p.id); qc.invalidateQueries(); toast.success("Boosted to the top for 24 hours!"); setPaying(false); return; } if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state); } toast.success("Boost pending - check M-Pesa."); } catch (e: any) { toast.error(String(e.message || e)); } finally { setPaying(false); } };
  const delPost = async (p: any) => { if (!window.confirm("Delete your ad?")) return; await supabase.from("posts").delete().eq("id", p.id); qc.invalidateQueries(); toast.success("Ad deleted"); };
  const submitComment = async (postId: string, parentId: string | null) => { if (!session) return toast.error("Sign in to comment"); const text = parentId ? replyBody : commentBody; if (!text.trim()) return toast.error("Write something first"); await supabase.from("post_comments").insert({ post_id: postId, user_id: session.user.id, parent_id: parentId, body: text.trim(), author_name: myName }); setCommentBody(""); setReplyBody(""); setReplyTo(null); qc.invalidateQueries(); };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">Soko47 Social</h1>
      <p className="mt-1 text-sm text-muted-foreground">Business ads that move - free to watch, KSh {Number(settings.social_price)}/week to post.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setFeedTab("foryou")} className={"rounded-full px-3 py-1 text-xs font-semibold " + (feedTab === "foryou" ? "bg-primary text-primary-foreground" : "bg-secondary")}>For you</button>
        <button onClick={() => setFeedTab("following")} className={"rounded-full px-3 py-1 text-xs font-semibold " + (feedTab === "following" ? "bg-primary text-primary-foreground" : "bg-secondary")}>Following</button>
        <Input className="w-40" placeholder="Search ads..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setSort("newest")} className={"rounded-full px-3 py-1 text-xs font-semibold " + (sort === "newest" ? "bg-primary text-primary-foreground" : "bg-secondary")}>Newest</button>
        <button onClick={() => setSort("trending")} className={"rounded-full px-3 py-1 text-xs font-semibold " + (sort === "trending" ? "bg-primary text-primary-foreground" : "bg-secondary")}>Trending</button>
      </div>
      {popularTags.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{popularTags.map((t) => (<button key={t} onClick={() => setActiveTag(activeTag === t ? "" : t)} className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (activeTag === t ? "bg-accent text-white" : "bg-accent/15 text-accent-deep")}>#{t}</button>))}</div>)}
      {!session ? (<div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm">Sign in to like, comment, save, follow and post.</div>) : !socialActive ? (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <h2 className="font-semibold">Unlock posting - KSh 100/week</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2"><Input className="w-44" placeholder="M-Pesa phone" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} /><Button onClick={paySocial} disabled={paying}>{paying ? "Waiting..." : "Activate - KSh {Number(settings.social_price)}/week"}</Button></div>
        </div>
      ) : !showForm ? (
        <div className="mt-6"><Button onClick={() => setShowForm(true)}>+ Post ads</Button></div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Post a business ad{isAdm ? " (admin - free)" : ""}</h2><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Close</Button></div>
          <div className="mt-2 flex gap-2">{["photo", "video", "blog", "story"].map((k) => (<button key={k} onClick={() => setKind(k)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (kind === k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{k}</button>))}</div>
          <div className="mt-3 space-y-3">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fresh avocados!" /></div>
            <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Tell buyers why..." /></div>
            <div><Label>Tags</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="avocado, fresh, nakuru" /></div>
            {kind === "photo" || kind === "story" ? <div><Label>Photo</Label><ImageUpload value={media} onChange={(u) => setMedia(u)} /></div> : null}
            {kind === "video" ? (<div><Label>Upload video</Label><VideoUpload value={mediaUrl} onChange={setMediaUrl} /><p className="mt-1 text-xs text-muted-foreground">or paste a link instead</p><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://...mp4" /></div>) : null}
            <Button onClick={createPost}>{kind === "story" ? "Post 24h story" : "Post ad"}</Button>
          </div>
        </div>
      )}
      {socialActive ? <div className="mt-4 flex justify-end"><Button size="sm" variant="outline" onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>+ Post ads</Button></div> : null}
      <div className="mt-6 space-y-4">
        {feed.map((p: any) => (
          <div key={p.id} id={p.id} className={"rounded-2xl border bg-card p-4 " + (boosted(p) ? "border-accent ring-1 ring-accent" : "border-border")}>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-sm font-semibold">{p.author_name}{p.author_verified ? <BadgeCheck className="size-4 text-accent" /> : null}{p.author_shop ? " · " + p.author_shop : ""}</p>
              <span className="text-xs text-muted-foreground">{when(p.created_at)}</span>
            </div>
            {boosted(p) ? <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-accent-deep"><Zap className="size-3" /> Boosted</p> : null}
            {p.expires_at ? <p className="mt-1 text-[11px] font-bold text-warning">Story - expires in {Math.max(0, Math.round((new Date(p.expires_at).getTime() - Date.now()) / 3600000))}h</p> : null}
            {p.title ? <h3 className="mt-2 font-display text-lg font-bold">{p.title}</h3> : null}
            {p.body ? <p className="mt-1 text-sm text-muted-foreground">{p.body}</p> : null}
            {tagsOf(p).length > 0 ? <div className="mt-1 flex flex-wrap gap-1">{tagsOf(p).map((t) => (<button key={t} onClick={() => setActiveTag(t)} className="text-[11px] font-semibold text-accent-deep">#{t}</button>))}</div> : null}
            {p.kind !== "video" && p.media_url ? <img src={p.media_url} alt={p.title || "ad"} className="mt-3 max-h-96 w-full rounded-xl object-cover" /> : null}
            {p.kind === "video" && p.media_url ? <div className="mt-3 w-full overflow-hidden rounded-xl bg-black"><video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto max-h-[75vh] w-full object-contain" /></div> : null}
            {p.author_shop_slug ? <Link to={"/shop/" + p.author_shop_slug} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-deep"><Store className="size-3.5" /> Visit shop</Link> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <button onClick={() => toggleLike(p.id)} className={"flex items-center gap-1 " + (myLikes[p.id] ? "text-red-500" : "text-muted-foreground")}><Heart className={"size-4 " + (myLikes[p.id] ? "fill-red-500" : "")} /> {likesCount[p.id] || 0}</button>
              <button onClick={() => { setOpenComments(openComments === p.id ? null : p.id); recordView(p.id); }} className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="size-4" /> {(commentsByPost[p.id] || []).length}</button>
              <span className="flex items-center gap-1 text-muted-foreground"><Eye className="size-4" /> {(p.views || 0) + (viewsCount[p.id] || 0)}</span>
              <button onClick={() => toggleSave(p.id)} className={"flex items-center gap-1 " + (savedMap[p.id] ? "text-accent-deep" : "text-muted-foreground")}><Bookmark className={"size-4 " + (savedMap[p.id] ? "fill-accent" : "")} /></button>
              <button onClick={() => share(p)} className="flex items-center gap-1 text-muted-foreground"><Share2 className="size-4" /></button>
              {session && p.user_id !== session.user.id ? (<button onClick={() => toggleFollow(p.user_id)} className="flex items-center gap-1 text-xs font-semibold text-accent-deep">{followSet[p.user_id] ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />} {followSet[p.user_id] ? "Following" : "Follow"}</button>) : null}
              {session && p.user_id !== session.user.id ? (<button onClick={() => report(p)} className="text-muted-foreground"><Flag className="size-4" /></button>) : null}
              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive"><Trash2 className="size-4" /></button>) : null}
              {session && p.user_id === session.user.id && !boosted(p) ? (<button onClick={() => boost(p)} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-deep"><Zap className="size-3" /> Boost KSh {Number(settings.boost_price)}</button>) : null}
            </div>
            {openComments === p.id ? (
              <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpenComments(null)}>
              <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[70vh] max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
              <p className="text-center text-sm font-semibold">{(commentsByPost[p.id] || []).length} comments</p>
              <div className="mt-3 space-y-2">
                {(commentsByPost[p.id] || []).filter((c: any) => !c.parent_id).map((c: any) => (
                  <div key={c.id}>
                    <p className="text-xs font-semibold">{c.author_name} <span className="font-normal text-muted-foreground">· {when(c.created_at)}</span></p>
                    <p className="text-sm">{c.body}</p>
                    <button className="text-xs font-semibold text-accent-deep" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Reply</button>
                    {(commentsByPost[p.id] || []).filter((r: any) => r.parent_id === c.id).map((r: any) => (<div key={r.id} className="ml-4 mt-1"><p className="text-xs font-semibold">{r.author_name}</p><p className="text-sm">{r.body}</p></div>))}
                    {replyTo === c.id ? (<div className="ml-4 mt-1 flex gap-2"><Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Reply..." /><Button size="sm" onClick={() => submitComment(p.id, c.id)}>Send</Button></div>) : null}
                  </div>
                ))}
                <div className="flex gap-2"><Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add a comment..." /><Button onClick={() => submitComment(p.id, null)}>Post</Button></div>
              </div>
              </div>
            ) : null}
          </div>
        ))}
        {feed.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet - follow traders or post the first ad!</p>}
      </div>
    </div>
  );
}
