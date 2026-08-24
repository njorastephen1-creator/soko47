import fs from 'fs';
const f = 'src/components/video-upload.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('if (file.size > 1024 * 1024 * 1024) return toast.error("Video too large - keep it under 1GB");').join('if (file.size > 900 * 1024 * 1024) return toast.error("Video too large - keep it under 900MB per video");');
c = c.split('Long videos upload in resumable chunks - up to 1GB / 10+ minutes.').join('Long videos upload in resumable chunks - up to 900MB per video.');
fs.writeFileSync(f, c);
console.log('DONE: 900MB per-video limit');