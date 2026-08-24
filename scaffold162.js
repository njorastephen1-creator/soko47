import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// state for expand/collapse
if (!c.includes('const [expanded, setExpanded]')) {
  c = c.split('const [editForm, setEditForm] = useState<any>(null);').join('const [editForm, setEditForm] = useState<any>(null);\n  const [expanded, setExpanded] = useState<any>({});');
}

// Images: full width, natural height, nothing cropped (portrait + landscape)
c = c.split('{p.kind !== "video" && p.media_url ? <img src={p.media_url} alt={p.title || "ad"} className="mt-3 max-h-96 w-full rounded-xl object-cover" /> : null}').join('{p.kind !== "video" && p.media_url ? <img src={p.media_url} alt={p.title || "ad"} className="mt-3 w-full rounded-xl" style={{ height: "auto" }} /> : null}');

// Videos: full width, natural aspect, nothing cropped or distorted
c = c.split('<video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto max-h-[90vh] w-full object-contain" />').join('<video src={p.media_url} controls autoPlay muted loop playsInline className="w-full" style={{ height: "auto" }} />');

// Description: clamp + See more / See less
c = c.split('{p.body ? <p className="mt-1 text-sm text-muted-foreground">{p.body}</p> : null}').join('{p.body ? (<div className="mt-1 text-sm text-muted-foreground"><p className={expanded[p.id] ? "" : "line-clamp-2"}>{p.body}</p>{String(p.body).length > 90 ? (<button className="mt-0.5 text-xs font-semibold text-accent-deep" onClick={() => setExpanded({ ...expanded, [p.id]: !expanded[p.id] })}>{expanded[p.id] ? "See less" : "See more"}</button>) : null}</div>) : null}');

// Edit button: clearly labeled so it's easy to find
c = c.split('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => startEdit(p)} className="text-accent-deep" title="Edit"><Pencil className="size-4" /></button>) : null}').join('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => startEdit(p)} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-deep"><Pencil className="size-3" /> Edit</button>) : null}');

fs.writeFileSync(f, c);
console.log('Social: full media + see-more + labeled edit');

// Video upload cap to TikTok-level
let vu = fs.readFileSync('src/components/video-upload.tsx', 'utf8');
if (vu.includes('50 * 1024 * 1024')) {
  vu = vu.split('if (file.size > 50 * 1024 * 1024) return toast.error("Video too large - keep it under 50MB");').join('if (file.size > 500 * 1024 * 1024) return toast.error("Video too large - keep it under 500MB");');
  fs.writeFileSync('src/components/video-upload.tsx', vu);
  console.log('Video cap raised to 500MB');
}
console.log('DONE');