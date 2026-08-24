import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');
const OLD = '[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]]';
const NEW = '[["produce", "Fresh Produce"], ["electronics", "Electronics"], ["fashion", "Fashion"], ["household", "Household"], ["furniture", "Furniture"], ["beauty", "Beauty"], ["hardware", "Hardware & Tools"], ["houses", "Houses & Real Estate"], ["cars", "Cars & Vehicles"], ["importexport", "Import & Export"], ["kinyozi", "Kinyozi / Barber"], ["salon", "Salon / Braiding"], ["laundry", "Laundry / Mama Fua"], ["fundi", "Fundi / Technician"], ["carwash", "Car Wash"], ["boda", "Boda Boda"], ["matatu", "Matatu / Agent"], ["mpesaagent", "M-Pesa Agent"], ["water", "Water Vendor"], ["cyber", "Cybercafé"], ["ecitizen", "eCitizen Agent"], ["photo", "Photo Studio"], ["services", "Services"], ["repair", "Repair & Construction"], ["other", "Other"]]';
if (!c.includes(OLD)) { console.log('exact string not found'); process.exit(1); }
c = c.split(OLD).join(NEW);
fs.writeFileSync(f, c);
console.log('DONE: 25 categories added');