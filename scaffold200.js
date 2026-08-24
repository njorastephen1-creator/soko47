import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');
const old = c.match(/\[\["produce"[^\]]*\]\]/);
if (!old) { console.log('array not found'); process.exit(1); }
const NEW = '[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["houses", "Houses & Real Estate"], ["cars", "Cars & Vehicles"], ["importexport", "Import & Export"], ["kinyozi", "Kinyozi / Barber"], ["salon", "Salon / Braiding"], ["laundry", "Laundry / Mama Fua"], ["fundi", "Fundi / Technician"], ["carwash", "Car Wash"], ["boda", "Boda Boda"], ["matatu", "Matatu / Agent"], ["mpesaagent", "M-Pesa Agent"], ["water", "Water Vendor"], ["cyber", "Cybercafé"], ["ecitizen", "eCitizen Agent"], ["photo", "Photo Studio"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]]';
c = c.split(old[0]).join(NEW);
fs.writeFileSync(f, c);
console.log('DONE: categories extended');