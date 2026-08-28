import fs from 'fs';
import path from 'path';

console.log('=== Files in src/routes/ ===');
const files = fs.readdirSync('src/routes');
files.forEach(f => console.log(f));

console.log('\n=== Files mentioning "unit" ===');
files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts')) {
    const content = fs.readFileSync(path.join('src/routes', f), 'utf8');
    if (/unit/i.test(content)) {
      console.log(f);
    }
  }
});