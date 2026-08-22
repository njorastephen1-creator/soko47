import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
let n = 0;
if (!c.includes('CheckCheck')) {
  c = c.split('import { Copy, Download, Pencil, Send, Trash2, X } from "lucide-react";').join('import { Check, CheckCheck, Copy, Download, Pencil, Send, Trash2, X } from "lucide-react";');
  n++;
}
if (!c.includes('read_at ? <CheckCheck')) {
  c = c.split('                  <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>\n                </div>').join('                  <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>\n                  {mine ? (m.read_at ? <CheckCheck className="size-3.5 text-[#53bdeb]" /> : <Check className="size-3.5 text-muted-foreground" />) : null}\n                </div>');
  n++;
}
fs.writeFileSync(f, c);
console.log('DONE:', n, 'whatsapp ticks added');