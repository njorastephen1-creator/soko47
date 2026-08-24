import fs from 'fs';
import path from 'path';
const OLD = '[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]]';
const NEW = '[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["houses", "Houses & Real Estate"], ["cars", "Cars & Vehicles"], ["importexport", "Import & Export"], ["kinyozi", "Kinyozi / Barber"], ["salon", "Salon / Braiding"], ["laundry", "Laundry / Mama Fua"], ["fundi", "Fundi / Technician"], ["carwash", "Car Wash"], ["boda", "Boda Boda"], ["matatu", "Matatu / Agent"], ["mpesaagent", "M-Pesa Agent"], ["water", "Water Vendor"], ["cyber", "Cybercafé"], ["ecitizen", "eCitizen Agent"], ["photo", "Photo Studio"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]]';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0;
for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes(OLD)) { c = c.split(OLD).join(NEW); fs.writeFileSync(f, c); n++; console.log('categories extended in', f); }
}
// cap -> 48MB (idempotent)
const v = 'src/components/video-upload.tsx';
let vc = fs.readFileSync(v, 'utf8');
vc = vc.split('const MAX = 45 * 1024 * 1024;').join('const MAX = 48 * 1024 * 1024;');
vc = vc.split('more than 45MB till further notice').join('more than 48MB till further notice');
vc = vc.split('Clips up to 45MB upload instantly').join('Clips up to 48MB upload instantly');
fs.writeFileSync(v, vc);
console.log(n ? 'DONE categories + 48MB' : 'no category match');