import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// notify helper
if (!c.includes('const notify = async')) {
  c = c.split('  const toggleLike = async (id: string)').join(`  const notify = async (userId: string, title: string, body: string) => {
    if (!userId || (session && userId === session.user.id)) return;
    await supabase.from("notifications").insert({ user_id: userId, title, body, link: "/social" });
  };
  const toggleLike = async (id: string)`);
}

// like: notify + fast targeted refresh
c = c.split('  const toggleLike = async (id: string) => { if (!session) return toast.error("Sign in to like"); if (myLikes[id]) await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id); else await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); };').join('  const toggleLike = async (id: string) => { if (!session) return toast.error("Sign in to like"); const post = (posts || []).find((x: any) => x.id === id); if (myLikes[id]) { await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id); } else { await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id }); if (post) notify(post.user_id, myName + " liked your ad", post.title || "Your ad"); } qc.invalidateQueries({ queryKey: ["social-likes"] }); };');

// save: fast refresh
c = c.split('else await supabase.from("post_saves").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); };').join('else await supabase.from("post_saves").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries({ queryKey: ["social-saves"] }); };');

// follow: notify + fast refresh
c = c.split('  const toggleFollow = async (authorId: string) => { if (!session) return toast.error("Sign in to follow"); if (followSet[authorId]) await supabase.from("post_follows").delete().eq("follower_id", session.user.id).eq("author_id", authorId); else await supabase.from("post_follows").insert({ follower_id: session.user.id, author_id: authorId }); qc.invalidateQueries(); };').join('  const toggleFollow = async (authorId: string) => { if (!session) return toast.error("Sign in to follow"); if (followSet[authorId]) { await supabase.from("post_follows").delete().eq("follower_id", session.user.id).eq("author_id", authorId); } else { await supabase.from("post_follows").insert({ follower_id: session.user.id, author_id: authorId }); notify(authorId, myName + " started following you", "See your ads in their Following feed"); } qc.invalidateQueries({ queryKey: ["social-follows"] }); };');

// view: fast refresh
c = c.split('if (!data) { await supabase.from("post_views").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries(); }').join('if (!data) { await supabase.from("post_views").insert({ post_id: id, user_id: session.user.id }); qc.invalidateQueries({ queryKey: ["social-views"] }); }');

// comment: notify + fast refresh
c = c.split('await supabase.from("post_comments").insert({ post_id: postId, user_id: session.user.id, parent_id: parentId, body: text.trim(), author_name: myName }); setCommentBody(""); setReplyBody(""); setReplyTo(null); qc.invalidateQueries(); };').join('await supabase.from("post_comments").insert({ post_id: postId, user_id: session.user.id, parent_id: parentId, body: text.trim(), author_name: myName }); const cpost = (posts || []).find((x: any) => x.id === postId); if (cpost) notify(cpost.user_id, myName + " commented on your ad", text.trim()); setCommentBody(""); setReplyBody(""); setReplyTo(null); qc.invalidateQueries({ queryKey: ["social-comments"] }); };');

// EDIT BUTTON (was missing) - insert before delete button
if (!c.includes('startEdit(p)} className="flex items-center gap-1 rounded-full bg-accent/15')) {
  c = c.split('              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive" title="Delete"><Trash2 className="size-4" /></button>) : null}').join('              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => startEdit(p)} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-accent-deep"><Pencil className="size-4" /> Edit</button>) : null}\n              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive" title="Delete"><Trash2 className="size-4" /></button>) : null}');
}

// Bigger action buttons
c = c.split('<div className="mt-3 flex flex-wrap items-center gap-3 text-sm">').join('<div className="mt-3 flex flex-wrap items-center gap-4 text-base">');
c = c.split('<Heart className={"size-4 " + (myLikes[p.id] ? "fill-red-500" : "")} />').join('<Heart className={"size-6 " + (myLikes[p.id] ? "fill-red-500" : "")} />');
c = c.split('<MessageCircle className="size-4" />').join('<MessageCircle className="size-6" />');
c = c.split('<Eye className="size-4" />').join('<Eye className="size-6" />');
c = c.split('<Bookmark className={"size-4 " + (savedMap[p.id] ? "fill-accent" : "")} />').join('<Bookmark className={"size-6 " + (savedMap[p.id] ? "fill-accent" : "")} />');
c = c.split('<button onClick={() => share(p)} className="flex items-center gap-1 text-muted-foreground"><Share2 className="size-4" /></button>').join('<button onClick={() => share(p)} className="flex items-center gap-1 text-muted-foreground"><Share2 className="size-6" /></button>');

fs.writeFileSync(f, c);
console.log('DONE: edit button + notifications + fast updates + bigger buttons');