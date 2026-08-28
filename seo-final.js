import fs from 'fs';

// Remove debug branch from api/og.js
let c = fs.readFileSync('api/og.js', 'utf8');
const DEBUG_START = '  // Debug mode: return raw fetch result';
const DEBUG_END = '  if (!base || !anon || !id) {';
const idx1 = c.indexOf(DEBUG_START);
const idx2 = c.indexOf(DEBUG_END);
if (idx1 !== -1 && idx2 !== -1) {
  c = c.slice(0, idx1) + c.slice(idx2);
  fs.writeFileSync('api/og.js', c);
  console.log('debug branch removed from api/og.js');
}

// Clean up temporary files
const files = [
  'seo1.js', 'seo2.js', 'seo3.js', 'seo4.js', 'seo5.js', 'seo6.js',
  'seo7.js', 'seo8.js', 'seo9.js', 'seo10.js', 'seo11.js', 'seo12.js',
  'seo13.js', 'seo14.js', 'seo15.js', 'seo16.js', 'seo17.js', 'seo18.js',
  'seo19.js', 'seo20.js', 'seo21.js', 'seo22.js', 'seo23.js',
  'find-key.js', 'check-og.js', 'check-og2.js', 'p4a.js', 'p4b.js', 'p4c.js',
  'p5a.js', 'lm1.js'
];
files.forEach(f => {
  try { fs.unlinkSync(f); console.log('deleted ' + f); } catch {}
});
console.log('\ncleanup complete');