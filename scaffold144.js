import fs from 'fs';
const f = 'src/lib/mpesa.ts';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('normalizePhone')) {
  c = c.split('export async function stkPush(phone: string, amount: number, reference: string, name: string) {').join(`function normalizePhone(p: string) {
  const cleaned = p.replace(/\\s+/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (!cleaned.startsWith("254")) return "254" + cleaned;
  return cleaned;
}
export async function stkPush(phone: string, amount: number, reference: string, name: string) {`);
  c = c.split('body: JSON.stringify({ phone, amount, reference, name })').join('body: JSON.stringify({ phone: normalizePhone(phone), amount, reference, name })');
  fs.writeFileSync(f, c);
  console.log('Phone normalization added');
} else console.log('already present');