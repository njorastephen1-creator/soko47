import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');
const before = c;
c = c.replace(/import \{[^}]*\}[^;]*from "lucide-react";/, 'import { BadgeCheck, Package, Plus, Store, Users } from "lucide-react";');
if (c === before) console.log('NO MATCH - line 3 needs manual edit');
else { fs.writeFileSync(f, c); console.log('FIXED import line'); }