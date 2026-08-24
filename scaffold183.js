import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// state
if (!c.includes('editingComment')) {
  c = c.split('const [replyTo, setReplyTo] = useState<string | null>(null); const [replyBody, setReplyBody] = useState("");').join('const [replyTo, setReplyTo] = useState<string | null>(null); const [replyBody, setReplyBody] = useState("");\n  const [editingComment, setEditingComment] = useState<string | null>(null); const [editCommentBody, setEditCommentBody] = useState("");');
}

// handlers
if (!c.includes('startEditComment')) {
  c = c.split('  const submitComment = async').join(`  const startEditComment = (cmt: any) => { setEditingComment(cmt.id); setEditCommentBody(cmt.body || ""); };
  const saveEditComment = async (id: string) => {
    if (!editCommentBody.trim()) return toast.error("Comment cannot be empty");
    const { error } = await supabase.from("post_comments").update({ body: editCommentBody.trim() }).eq("id", id);
    if (error) return toast.error(error.message);
    setEditingComment(null); setEditCommentBody(""); qc.invalidateQueries({ queryKey: ["social-comments"] }); toast.success("Comment updated");
  };
  const delComment = async (id: string) => {
    if (!window.confirm("Delete this comment and its replies?")) return;
    await supabase.from("post_comments").delete().eq("parent_id", id);
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["social-comments"] }); toast.success("Comment deleted");
  };
  const submitComment = async`);
}

// top-level comment: inline edit + edit/delete buttons
c = c.split('                    <p className="mt-0.5 text-sm">{cc.body}</p>\n                    <button className="mt-0.5 text-xs font-semibold text-muted-foreground" onClick={() => setReplyTo(replyTo === cc.id ? null : cc.id)}>Reply</button>').join('                    {editingComment === cc.id ? (<div className="mt-1 flex gap-2"><Input value={editCommentBody} onChange={(e) => setEditCommentBody(e.target.value)} /><Button size="sm" onClick={() => saveEditComment(cc.id)}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>Cancel</Button></div>) : (<p className="mt-0.5 text-sm">{cc.body}</p>)}\n                    <div className="mt-0.5 flex gap-3">\n                      <button className="text-xs font-semibold text-muted-foreground" onClick={() => setReplyTo(replyTo === cc.id ? null : cc.id)}>Reply</button>\n                      {session && (cc.user_id === session.user.id || isAdm) ? (<button className="text-xs font-semibold text-accent-deep" onClick={() => startEditComment(cc)}>Edit</button>) : null}\n                      {session && (cc.user_id === session.user.id || isAdm) ? (<button className="text-xs font-semibold text-destructive" onClick={() => delComment(cc.id)}>Delete</button>) : null}\n                    </div>');

// replies: edit/delete for owner/admin
c = c.split('                        <div className="flex-1"><p className="text-xs font-semibold">{r.author_name}</p><p className="text-sm">{r.body}</p></div>').join('                        <div className="flex-1">\n                          <p className="text-xs font-semibold">{r.author_name}</p>\n                          {editingComment === r.id ? (<div className="mt-1 flex gap-2"><Input value={editCommentBody} onChange={(e) => setEditCommentBody(e.target.value)} /><Button size="sm" onClick={() => saveEditComment(r.id)}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>Cancel</Button></div>) : (<p className="text-sm">{r.body}</p>)}\n                          {session && (r.user_id === session.user.id || isAdm) ? (<div className="flex gap-3"><button className="text-[11px] font-semibold text-accent-deep" onClick={() => startEditComment(r)}>Edit</button><button className="text-[11px] font-semibold text-destructive" onClick={() => delComment(r.id)}>Delete</button></div>) : null}\n                        </div>');

fs.writeFileSync(f, c);
console.log('DONE: edit + delete comments');