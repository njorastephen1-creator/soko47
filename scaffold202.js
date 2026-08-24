import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');

// Smaller, precise anchor
const OLD = '["hardware", "Hardware & Tools"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]';
const NEW = '["hardware", "Hardware & Tools"], ["houses", "Houses & Real Estate"], ["cars", "Cars & Vehicles"], ["importexport", "Import & Export"], ["kinyozi", "Kinyozi / Barber"], ["salon", "Salon / Braiding"], ["laundry", "Laundry / Mama Fua"], ["fundi", "Fundi / Technician"], ["carwash", "Car Wash"], ["boda", "Boda Boda"], ["matatu", "Matatu / Agent"], ["mpesaagent", "M-Pesa Agent"], ["water", "Water Vendor"], ["cyber", "Cybercafé"], ["ecitizen", "eCitizen Agent"], ["photo", "Photo Studio"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]';

if (!c.includes(OLD)) {
  console.log('Anchor still not found. Here is the text around Hardware:');
  const idx = c.indexOf('Hardware');
  if (idx !== -1) console.log(JSON.stringify(c.substring(idx, idx + 200)));
  else console.log('Hardware not even in the file!');
  process.exit(1);
}

c = c.split(OLD).join(NEW);
fs.writeFileSync(f, c);
console.log('DONE: 25 categories successfully injected');