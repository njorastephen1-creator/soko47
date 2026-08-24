import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('<div className="fixed inset-0 z-50 bg-black/80" onClick={() => setOpenComments(null)}>').join('<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpenComments(null)}>');
fs.writeFileSync(f, c);
console.log('DONE: lighter comments backdrop');