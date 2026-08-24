import fs from 'fs';
const f = 'src/components/video-upload.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('const fail = () => { setBusy(false); setProgress(0); toast.error("Upload failed. Try a shorter or compressed clip, or paste a link instead."); };').join('const fail = (err?: any) => { setBusy(false); setProgress(0); const raw = err && err.message ? err.message : err ? String(err) : ""; console.error("VIDEO UPLOAD ERROR:", raw); toast.error(raw ? "Upload failed: " + raw : "Upload failed. Try a shorter or compressed clip, or paste a link instead."); };');
c = c.split('onError: () => { if (wd) clearTimeout(wd); fail(); },').join('onError: (err: any) => { if (wd) clearTimeout(wd); fail(err); },');
c = c.split('if (error) { fail(); return; }').join('if (error) { fail(error); return; }');
c = c.split('wd = setTimeout(() => { if (!started) { try { upload.abort(); } catch (e) {} fail(); } }, 25000);').join('wd = setTimeout(() => { if (!started) { try { upload.abort(); } catch (e) {} fail("no response from storage - check connection or size limit"); } }, 25000);');
fs.writeFileSync(f, c);
console.log('DONE: show real upload error');