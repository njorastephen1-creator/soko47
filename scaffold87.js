import fs from 'fs';
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
let n = 0;
if (!pay.includes('from "@/lib/mpesa"')) {
  pay = pay.split('import { Button } from "@/components/ui/button";').join('import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";\nimport { stkPush, stkStatus } from "@/lib/mpesa";');
  n++;
}
if (!pay.includes('mpesaPhone')) {
  pay = pay.split('  const [busy, setBusy] = useState<string | null>(null);').join('  const [busy, setBusy] = useState<string | null>(null);\n  const [mpesaPhone, setMpesaPhone] = useState("");\n  useEffect(() => {\n    if (order && !mpesaPhone) setMpesaPhone(order.buyer_phone || "");\n  }, [order]);');
  n++;
}
if (pay.includes('stkPush(order.buyer_phone,')) {
  pay = pay.split('stkPush(order.buyer_phone,').join('stkPush(mpesaPhone.trim() || order.buyer_phone,');
  n++;
}
if (!pay.includes('Enter a valid M-Pesa number to receive the prompt')) {
  pay = pay.split('  const payGroup = async (g: any) => {\n    setBusy(g.v.id);').join('  const payGroup = async (g: any) => {\n    if (mpesaPhone.replace(/[^0-9]/g, "").length < 10) { toast.error("Enter a valid M-Pesa number to receive the prompt"); return; }\n    setBusy(g.v.id);');
  pay = pay.split('if (fired47.current || !groups.length || !order) return;').join('if (fired47.current || !groups.length || !order || mpesaPhone.replace(/[^0-9]/g, "").length < 10) return;');
  n++;
}
if (pay.includes('payGroup(g47[0]);\n  }, [groups.length, order]);')) {
  pay = pay.split('payGroup(g47[0]);\n  }, [groups.length, order]);').join('payGroup(g47[0]);\n  }, [groups.length, order, mpesaPhone]);');
  n++;
}
if (!pay.includes('M-Pesa number to receive the prompt</Label>')) {
  pay = pay.split('<p className="mt-1 text-sm text-muted-foreground">Money goes straight to each trader - Soko47 never touches it. Order for {order.buyer_name} · {order.buyer_phone}</p>').join('<p className="mt-1 text-sm text-muted-foreground">Money goes straight to each trader - Soko47 never touches it. Order for {order.buyer_name} · {order.buyer_phone}</p>\n      <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">\n        <Label>📲 M-Pesa number to receive the prompt</Label>\n        <Input className="mt-2" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="07XX XXX XXX" />\n        <p className="mt-1 text-xs text-muted-foreground">The prompt will pop on this phone - edit if it is not your M-Pesa number.</p>\n      </div>');
  n++;
}
fs.writeFileSync('src/routes/pay.$id.tsx', pay);
console.log('DONE:', n, 'buyer M-Pesa number patches');