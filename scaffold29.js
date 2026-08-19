import fs from 'fs';
let index = fs.readFileSync('src/routes/index.tsx', 'utf8');
const oldLine = '<p className="text-xs text-muted-foreground">{c.markets.length} markets</p>';
const newLine = '<p className="text-xs text-muted-foreground">{Array.isArray((c as any).markets) ? (c as any).markets.length + " markets" : "View markets"}</p>';
if (index.includes(oldLine)) {
  index = index.split(oldLine).join(newLine);
  fs.writeFileSync('src/routes/index.tsx', index);
  console.log('DONE: county cards fixed');
} else {
  console.log('WARNING: line not found - checking alternate');
  index = index.split('{c.markets.length}').join('{(c.markets || []).length}');
  fs.writeFileSync('src/routes/index.tsx', index);
  console.log('DONE: safe length fallback');
}