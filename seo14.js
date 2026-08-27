import fs from 'fs';

console.log('=== Files in api/ ===');
const apiFiles = fs.readdirSync('api');
apiFiles.forEach(f => console.log(f));

console.log('\n=== Does api/og.js exist? ===');
console.log(fs.existsSync('api/og.js'));

console.log('\n=== Content of api/og.js (first 500 chars) ===');
if (fs.existsSync('api/og.js')) {
  console.log(fs.readFileSync('api/og.js', 'utf8').slice(0, 500));
}

console.log('\n=== Does api/og/[id].js still exist? ===');
try {
  const exists = fs.existsSync('api/og/[id].js');
  console.log(exists);
  if (exists) {
    console.log('\nRemoving api/og/[id].js...');
    fs.unlinkSync('api/og/[id].js');
    console.log('removed');
  }
} catch (e) {
  console.log('error:', e.message);
}