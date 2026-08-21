import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
let n = 0;
if (!c.includes('onContextMenu')) {
  c = c.split('import { Download, Pencil, Send, Trash2, X } from "lucide-react";').join('import { Copy, Download, Pencil, Send, Trash2, X } from "lucide-react";');
  c = c.split('<div onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === m.id ? null : m.id); }} className={"cursor-pointer rounded-xl px-3 py-2 text-sm shadow-sm " + bubbleBg + " " + ring}>').join('<div onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedId(m.id); if (navigator.vibrate) navigator.vibrate(40); }} onTouchStart={() => { (window as any).__lp = setTimeout(() => { setSelectedId(m.id); if (navigator.vibrate) navigator.vibrate(40); }, 450); }} onTouchEnd={() => clearTimeout((window as any).__lp)} onTouchMove={() => clearTimeout((window as any).__lp)} className={"rounded-xl px-3 py-2 text-sm shadow-sm " + bubbleBg + " " + ring}>');
  n++;
}
if (!c.includes('doCopy')) {
  c = c.split('  return (\n    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }} onClick={() => setSelectedId(null)}>').join('  const doCopy = () => {\n    if (!selectedMsg) return;\n    navigator.clipboard.writeText(selectedMsg.body);\n    toast.success("Message copied");\n    setSelectedId(null);\n  };\n  return (\n    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }} onClick={() => setSelectedId(null)}>');
  n++;
}
if (!c.includes('bg-[#202c33]')) {
  c = c.split('<div className="flex items-center gap-3 rounded-t-2xl bg-[#075E54] p-3 text-white">').join('<div className={"flex items-center gap-3 rounded-t-2xl p-3 text-white " + (selectedMsg ? "bg-[#202c33]" : "bg-[#075E54]")}>');
  n++;
}
if (!c.includes('onClick={doCopy}')) {
  c = c.split('          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>').join('          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>\n            <button onClick={doCopy} className="rounded-full p-2 hover:bg-white/10" title="Copy"><Copy className="size-5" /></button>');
  n++;
}
if (c.includes('Tap any message for options')) {
  c = c.split('Tap any message for options').join('Long-press / right-click a message');
  n++;
}
fs.writeFileSync(f, c);
console.log('DONE:', n, 'WhatsApp gesture patches');