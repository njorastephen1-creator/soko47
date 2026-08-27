import fs from 'fs';
import path from 'path';

console.log('=== vercel.json ===');
console.log(fs.readFileSync('vercel.json', 'utf8'));

console.log('\n=== api folder contents ===');
if (fs.existsSync('api')) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)).map(f => path.join(e.name, f)) : [e.name]);
  console.log(walk('api'));
} else {
  console.log('(api folder does not exist)');
}

console.log('\n=== Does api/og/[id].js exist? ===');
console.log(fs.existsSync('api/og/[id].js'));