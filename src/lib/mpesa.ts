function normalizePhone(p: string) {
  const cleaned = p.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (!cleaned.startsWith("254")) return "254" + cleaned;
  return cleaned;
}
export async function stkPush(phone: string, amount: number, reference: string, name: string) {
  const r = await fetch("/api/stk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: normalizePhone(phone), amount, reference, name }) });
  const d = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(d.error || (d.details ? JSON.stringify(d.details) : "STK push failed (" + r.status + ")"));
  return d;
}
export async function stkStatus(invoice: string) {
  const r = await fetch("/api/stk-status?invoice=" + encodeURIComponent(invoice));
  return r.json().catch(() => ({} as any));
}
