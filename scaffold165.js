import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('<VideoUpload value={editForm.media_url}')) {
  const before = c;
  c = c.split('                  <ImageUpload value={editForm.media_url} onChange={(u) => setEditForm({ ...editForm, media_url: u })} />\n                </div>').join('                  <ImageUpload value={editForm.media_url} onChange={(u) => setEditForm({ ...editForm, media_url: u })} />\n                  <VideoUpload value={editForm.media_url} onChange={(u) => setEditForm({ ...editForm, media_url: u })} />\n                </div>');
  if (c === before) console.log('NO MATCH');
  else { fs.writeFileSync(f, c); console.log('Edit modal: upload video added'); }
} else console.log('already present');