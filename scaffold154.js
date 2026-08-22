import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// state
if (!c.includes('const [showForm, setShowForm]')) {
  c = c.split('const [feedTab, setFeedTab] = useState("foryou");').join('const [feedTab, setFeedTab] = useState("foryou");\n  const [showForm, setShowForm] = useState(false);');
}
// close form after successful post
if (!c.includes('setShowForm(false); qc.invalidateQueries(); toast.success(kind === "story"')) {
  c = c.split('qc.invalidateQueries(); toast.success(kind === "story" ? "Story live for 24 hours!" : "Your ad is live!");').join('setShowForm(false); qc.invalidateQueries(); toast.success(kind === "story" ? "Story live for 24 hours!" : "Your ad is live!");');
}
// collapsed form -> button
if (!c.includes('+ Post ads</Button>')) {
  c = c.split('      ) : (\n        <div className="mt-6 rounded-2xl border border-border bg-card p-5">\n          <h2 className="font-semibold">Post a business ad{isAdm ? " (admin - free)" : ""}</h2>').join('      ) : !showForm ? (\n        <div className="mt-6"><Button onClick={() => setShowForm(true)}>+ Post ads</Button></div>\n      ) : (\n        <div className="mt-6 rounded-2xl border border-border bg-card p-5">\n          <div className="flex items-center justify-between"><h2 className="font-semibold">Post a business ad{isAdm ? " (admin - free)" : ""}</h2><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Close</Button></div>');
}
// persistent add button above feed
if (!c.includes('window.scrollTo({ top: 0, behavior: "smooth" })')) {
  c = c.split('      <div className="mt-6 space-y-4">').join('      {socialActive ? <div className="mt-4 flex justify-end"><Button size="sm" variant="outline" onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>+ Post ads</Button></div> : null}\n      <div className="mt-6 space-y-4">');
}
// autoplay videos like TikTok
if (!c.includes('autoPlay muted loop playsInline')) {
  c = c.split('<video src={p.media_url} controls className="mt-3 max-w-[260px] rounded-xl border border-border" />').join('<video src={p.media_url} controls autoPlay muted loop playsInline className="mt-3 w-full rounded-xl border border-border" />');
}
fs.writeFileSync(f, c);
console.log('DONE: collapsible post form + autoplay videos');