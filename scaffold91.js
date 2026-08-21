import fs from 'fs';
for (const f of ['src/routes/product.$id.tsx', 'src/routes/_authenticated/orders.tsx', 'src/routes/_authenticated/vendor.tsx', 'src/routes/checkout.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('MessageCircle') && !c.includes('MessageCircle } from "lucide-react"') && !c.includes('MessageCircle,')) {
    const m = c.match(/import \{([^}]+)\} from "lucide-react";/);
    if (m) {
      c = c.replace(/import \{([^}]+)\} from "lucide-react";/, 'import {' + m[1].trim() + ', MessageCircle } from "lucide-react";');
    } else {
      c = 'import { MessageCircle } from "lucide-react";\n' + c;
    }
    fs.writeFileSync(f, c);
    console.log('FIXED import in', f);
  }
}
console.log('DONE');