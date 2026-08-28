import fs from 'fs';
import path from 'path';

function search(dir, pattern) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.isDirectory() && !f.name.startsWith('.') && !['node_modules', 'dist'].includes(f.name)) {
      search(path.join(dir, f.name), pattern);
    } else if (f.isFile() && /\.(ts|tsx|js)$/.test(f.name)) {
      const content = fs.readFileSync(path.join(dir, f.name), 'utf8');
      if (pattern.test(content)) {
        console.log('\n=== ' + path.join(dir, f.name) + ' ===');
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (pattern.test(l)) console.log((i + 1) + ': ' + l.slice(0, 150));
        });
      }
    }
  }
}
search('src', /eyJ|supabaseUrl|createClient|SUPABASE/);