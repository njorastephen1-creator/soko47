import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('startEdit(p)} className="flex items-center')) {
  const before = c;
  // Insert Edit button right before the delete button (actual current form, no title attr)
  c = c.split('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive"><Trash2 className="size-4" /></button>) : null}').join('{session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => startEdit(p)} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-accent-deep"><Pencil className="size-4" /> Edit</button>) : null}\n              {session && (p.user_id === session.user.id || isAdm) ? (<button onClick={() => delPost(p)} className="text-destructive"><Trash2 className="size-4" /></button>) : null}');
  if (c === before) console.log('NO MATCH - delete line different');
  else { fs.writeFileSync(f, c); console.log('Edit button inserted'); }
} else console.log('Edit button already present');