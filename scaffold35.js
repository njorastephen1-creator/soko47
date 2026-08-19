import fs from 'fs';
let browse = fs.readFileSync('src/routes/browse.tsx', 'utf8');
let changed = false;
if (browse.includes('<div className="mt-3 flex flex-wrap gap-2">')) {
  browse = browse.split('<div className="mt-3 flex flex-wrap gap-2">').join('<div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3">');
  changed = true;
}
if (browse.includes('(!sub ? "bg-secondary" : "border-border bg-card")')) {
  browse = browse.split('(!sub ? "bg-secondary" : "border-border bg-card")').join('(!sub ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20")');
  changed = true;
}
if (browse.includes('(sub === s ? "bg-secondary" : "border-border bg-card")')) {
  browse = browse.split('(sub === s ? "bg-secondary" : "border-border bg-card")').join('(sub === s ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20")');
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/browse.tsx', browse); console.log('DONE: gold sub-category chips'); }
else console.log('WARNING: patterns not found');