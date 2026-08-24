import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// comment likes query
if (!c.includes('social-comment-likes')) {
  c = c.split('  const socialActive = isAdm ||').join('  const { data: commentLikes } = useQuery({ queryKey: ["social-comment-likes"], refetchInterval: 20000, queryFn: async () => { const { data } = await supabase.from("post_comment_likes").select("comment_id, user_id"); return data || []; } });\n  const socialActive = isAdm ||');
}
// maps
if (!c.includes('commentLikesCount')) {
  c = c.split('  const tagCounts: any = {};').join('  const commentLikesCount: any = {}; const myCommentLikes: any = {};\n  (commentLikes || []).forEach((l: any) => { commentLikesCount[l.comment_id] = (commentLikesCount[l.comment_id] || 0) + 1; if (session && l.user_id === session.user.id) myCommentLikes[l.comment_id] = true; });\n  const tagCounts: any = {};');
}
// toggle
if (!c.includes('toggleCommentLike')) {
  c = c.split('  const submitComment = async').join(`  const toggleCommentLike = async (id: string) => { if (!session) return toast.error("Sign in to like"); if (myCommentLikes[id]) await supabase.from("post_comment_likes").delete().eq("comment_id", id).eq("user_id", session.user.id); else await supabase.from("post_comment_likes").insert({ comment_id: id, user_id: session.user.id }); qc.invalidateQueries({ queryKey: ["social-comment-likes"] }); };
  const submitComment = async`);
}

// Replace the whole comments sheet with Instagram-style version
const startMarker = '      {openComments ? (';
const endMarker = '    </div>\n  );\n}';
const si = c.indexOf(startMarker);
const ei = c.lastIndexOf(endMarker);
if (si !== -1 && ei !== -1 && ei > si) {
  const before = c.slice(0, si);
  const after = c.slice(ei);
  const sheet = `      {openComments ? (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setOpenComments(null)}>
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80vh] max-w-2xl flex-col rounded-t-3xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <div className="relative flex items-center justify-center px-4 py-3">
              <p className="text-sm font-semibold">Comments ({(commentsByPost[openComments] || []).length})</p>
              <button onClick={() => setOpenComments(null)} className="absolute right-3 text-muted-foreground"><X className="size-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
              {(commentsByPost[openComments] || []).filter((cc: any) => !cc.parent_id).map((cc: any) => (
                <div key={cc.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{cc.author_name} <span className="font-normal text-muted-foreground">· {when(cc.created_at)}</span></p>
                    <p className="mt-0.5 text-sm">{cc.body}</p>
                    <button className="mt-0.5 text-xs font-semibold text-accent-deep" onClick={() => setReplyTo(replyTo === cc.id ? null : cc.id)}>Reply</button>
                    {(commentsByPost[openComments] || []).filter((r: any) => r.parent_id === cc.id).map((r: any) => (
                      <div key={r.id} className="mt-1 flex items-start gap-2 rounded-xl bg-secondary/60 p-2">
                        <div className="flex-1"><p className="text-xs font-semibold">{r.author_name}</p><p className="text-sm">{r.body}</p></div>
                        <button onClick={() => toggleCommentLike(r.id)} className={"pt-0.5 " + (myCommentLikes[r.id] ? "text-red-500" : "text-muted-foreground")}><Heart className={"size-4 " + (myCommentLikes[r.id] ? "fill-red-500" : "")} /></button>
                      </div>
                    ))}
                    {replyTo === cc.id ? (<div className="mt-1 flex gap-2"><Input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Reply..." /><Button size="sm" onClick={() => submitComment(openComments, cc.id)}>Send</Button></div>) : null}
                  </div>
                  <button onClick={() => toggleCommentLike(cc.id)} className={"flex flex-col items-center gap-0.5 pt-1 " + (myCommentLikes[cc.id] ? "text-red-500" : "text-muted-foreground")}>
                    <Heart className={"size-4 " + (myCommentLikes[cc.id] ? "fill-red-500" : "")} />
                    <span className="text-[10px]">{commentLikesCount[cc.id] || 0}</span>
                  </button>
                </div>
              ))}
              {(commentsByPost[openComments] || []).length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Be the first to comment.</p>}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add a comment..." />
              <Button onClick={() => submitComment(openComments, null)}>Post</Button>
            </div>
          </div>
        </div>
      ) : null}
`;
  c = before + sheet + after;
  fs.writeFileSync(f, c);
  console.log('Instagram-style comments + comment likes');
} else {
  console.log('markers not found');
}