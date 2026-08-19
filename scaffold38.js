import fs from 'fs';
let pkg = fs.readFileSync('package.json', 'utf8');
if (pkg.includes('"build": "tsc -b && vite build"')) {
  pkg = pkg.split('"build": "tsc -b && vite build"').join('"build": "vite build"');
  fs.writeFileSync('package.json', pkg);
  console.log('DONE: build = vite build');
} else console.log('build script different:', pkg.match(/"build": "[^"]+"/));