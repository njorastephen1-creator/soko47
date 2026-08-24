import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');

// import useEffect
c = c.split('import { useState } from "react";').join('import { useEffect, useState } from "react";');

// pause videos when tab hidden / app minimized + lock scroll when comments open
if (!c.includes('const pauseAll = ()')) {
  c = c.split('  const [expanded, setExpanded] = useState<any>({});').join(`  const [expanded, setExpanded] = useState<any>({});
  useEffect(() => {
    const pauseAll = () => { document.querySelectorAll("video").forEach((v) => v.pause()); };
    const onVis = () => { if (document.hidden) pauseAll(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", pauseAll);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", pauseAll); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = openComments ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openComments]);`);
}

// Cap video height (professional, fits every screen, nothing cropped)
c = c.split('(<div className="mt-3 w-full overflow-hidden rounded-xl bg-black"><video src={p.media_url} controls autoPlay muted loop playsInline className="w-full" style={{ height: "auto" }} /></div>)').join('(<div className="mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black" style={{ maxHeight: "65vh" }}><video src={p.media_url} controls autoPlay muted loop playsInline className="w-full object-contain" style={{ maxHeight: "65vh" }} /></div>)');

// Cap image height too
c = c.split('{p.kind !== "video" && p.media_url ? <img src={p.media_url} alt={p.title || "ad"} className="mt-3 w-full rounded-xl" style={{ height: "auto" }} /> : null}').join('{p.kind !== "video" && p.media_url ? (<div className="mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black" style={{ maxHeight: "70vh" }}><img src={p.media_url} alt={p.title || "ad"} className="w-full object-contain" style={{ maxHeight: "70vh" }} /></div>) : null}');

// Comments: dim the rest heavily (TikTok focus)
c = c.split('<div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpenComments(null)}>').join('<div className="fixed inset-0 z-50 bg-black/80" onClick={() => setOpenComments(null)}>');

fs.writeFileSync(f, c);
console.log('DONE: capped media + comment focus + pause on minimize');