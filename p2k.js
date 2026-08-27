import fs from 'fs';
import path from 'path';

// Find all files that call /api/r2-presign and add auth header
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

let updated = 0;
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('/api/r2-presign')) continue;

  // Look for fetch calls to /api/r2-presign
  if (c.includes('fetch("/api/r2-presign"')) {
    // Replace the fetch call to include auth header
    const regex = /fetch\("\/api\/r2-presign"([^)]*)\)/g;
    let newC = c.replace(regex, (match, args) => {
      if (match.includes('Authorization')) return match; // already has auth
      // Insert auth header after the URL
      return `fetch("/api/r2-presign", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await supabase.auth.getSession()).data.session?.access_token }, ${args.replace(/,\s*{/, '').replace(/}$/, '').trim() || ''} })`;
    });
    
    if (newC !== c) {
      fs.writeFileSync(f, newC);
      updated++;
      console.log('updated:', f);
    }
  }
}

console.log(updated ? 'DONE: ' + updated + ' files updated with auth headers' : 'no files found calling r2-presign');