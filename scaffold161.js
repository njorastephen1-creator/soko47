import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1) Add edit state + Pencil icon
if (!c.includes('Pencil,')) {
  c = c.split('BadgeCheck, Bookmark,').join('BadgeCheck, Bookmark, Pencil,');
}
if (!c.includes('editingPost')) {
  c = c.split('const [showForm, setShowForm] = useState(false);').join('const [showForm, setShowForm] = useState(false);\n  const [editingPost, setEditingPost] = useState<any>(null);\n  const [editForm, setEditForm] = useState<any>(null);');
}

// 2) Edit + update handlers
if (!c.includes('startEdit(')) {
  c = c.split('  const delPost = async (p: any)').join(`  const startEdit = (p: any) => { setEditingPost(p); setEditForm({ title: p.title || "", body: p.body || "", tags: p.tags || "", media_url: p.media_url || "" }); };
  const saveEdit = async () => {
    if (!editingPost) return;
    const { error } = await supabase.from("posts").update({ title: editForm.title.trim() || null, body: editForm.body.trim() || null, tags: editForm.tags.trim() || null, media_url: editForm.media_url.trim() || null }).eq("id", editingPost.id);
    if (error) return toast.error(error.message);
    setEditingPost(null); setEditForm(null); qc.invalidateQueries(); toast.success("Ad updated");
  };
  const cancelEdit = () => { setEditingPost(null); setEditForm(null); };
  const delPost = async (p: any)`);
}

// 3) Edit button (author or admin)
if (!c.includes('setEditingPost')) {
  c = c.split('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive"><Trash2 className="size-4" /></button>) : null}').join('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => startEdit(p)} className="text-accent-deep" title="Edit"><Pencil className="size-4" /></button>) : null}\n              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive" title="Delete"><Trash2 className="size-4" /></button>) : null}');
}

// 4) TikTok-style tall video (portrait fills 90vh)
if (!c.includes('max-h-[90vh]')) {
  c = c.split('<div className="mt-3 w-full overflow-hidden rounded-xl bg-black"><video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto max-h-[75vh] w-full object-contain" /></div>').join('<div className="mt-3 w-full overflow-hidden rounded-xl bg-black"><video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto max-h-[90vh] w-full object-contain" /></div>');
}

// 5) Edit modal
if (!c.includes('editingPost ? (')) {
  c = c.split('      {openComments ? (').join(`      {editingPost ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4" onClick={cancelEdit}>
          <div className="mx-auto my-8 max-w-lg rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Edit your ad</h2>
              <button onClick={cancelEdit} className="text-muted-foreground"><X className="size-5" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} rows={3} /></div>
              <div><Label>Tags</Label><Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="comma, separated, tags" /></div>
              <div><Label>Media</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { const url = window.prompt("Paste new image or video link (leave empty to remove)"); if (url !== null) setEditForm({ ...editForm, media_url: url }); }}>Change link</Button>
                  <ImageUpload value={editForm.media_url} onChange={(u) => setEditForm({ ...editForm, media_url: u })} />
                </div>
                {editForm.media_url ? (<div className="mt-2">{editingPost.kind === "video" ? <video src={editForm.media_url} controls className="max-h-48 rounded-xl" /> : <img src={editForm.media_url} alt="" className="max-h-48 rounded-xl" />}</div>) : null}
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Save changes</Button>
                <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {openComments ? (`);
}

fs.writeFileSync(f, c);
console.log('DONE: TikTok tall video + edit capability');