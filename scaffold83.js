import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (vendor.includes('Starter KSh 499 (25 products)')) {
  vendor = vendor.split('Starter KSh 499 (25 products)').join('Starter KSh 499 (100 products)');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('DONE: 100 products on Starter');
} else console.log('text not found - check manually');