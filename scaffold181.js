import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// Avatar helper (initials circle, Instagram-style)
if (!c.includes('function Avatar')) {
  c = c.split('function when(t: string)').join(`function Avatar({ name, small }: any) {
  const ch = (name || "?").charAt(0).toUpperCase();
  return <span className={"flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-white " + (small ? "size-7 text-xs" : "size-9 text-sm")}>{ch}</span>;
}
function when(t: string)`);
}

const startMarker = '      {openComments ? (';
const endMarker = '    </div>\n  );\n}';
const si = c.indexOf(startMarker);
const ei = c.lastIndexOf(endMarker);
if (si !== -1 && ei !== -1 && ei > si) {
  const before = c.slice(0, si);
  const after = c.slice(ei);
  const sheet = `      {openComments ? (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setOpenComments(null)}>
          <div className="absolute left-1/2 top-1/2 flex max-h-[82vh] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-center justify-center px-4 py-3">
              <p className="text-sm font-semibold">Comments</p>
              <button onClick={() => setOpenComments(null)} className="absolute right-3 text-muted-foreground"><X className="size-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-3">
              {(commentsByPost[openComments] || []).filter((cc: any) => !cc.parent_id).map((cc: any) => (
                <div key={cc.id} className="flex items-start gap-2">
                  <Avatar name={cc.author_name} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{cc.author_name} <span className="font-normal text-muted-foreground">{when(cc.created_at)}</span></p>
                    <p className="mt-0.5 text-sm">{cc.body}</p>
                    <button className="mt-0.5 text-xs font-semibold text-muted-foreground" onClick={() => setReplyTo(replyTo === cc.id ? null : cc.id)}>Reply</button>
                    {(commentsByPost[openComments] || []).filter((r: any) => r.parent_id === cc.id).map((r: any) => (
                      <div key={r.id} className="mt-2 flex items-start gap-2">
                        <Avatar name={r.author_name} small />
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
            <div className="border-t border-border p-3">
              <div className="mb-2 flex justify-between px-1">
                {["❤️", "🙌", "🔥", "", "😢", "😍", "😮", "😂"].map((e) => (<button key={e} className="text-xl" onClick={() => setCommentBody(commentBody + e)}>{e}</button>))}
              </div>
              <div className="flex gap-2">
                <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Join the conversation..." />
                <Button onClick={() => submitComment(openComments, null)}>Post</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
`;
  c = before + sheet + after;
  fs.writeFileSync(f, c);
  console.log('Instagram-look comments card');
} else console.log('markers not found');