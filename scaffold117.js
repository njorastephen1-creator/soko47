import fs from 'fs';
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (v.includes('🏪') || v.includes('➕') || v.includes('💬') || v.includes('🛵') || v.includes('✅') || v.includes('⚠️')) {
  if (!v.includes('from "lucide-react"')) v = v.split('import { Button } from "@/components/ui/button";').join('import { Button } from "@/components/ui/button";\nimport { AlertTriangle, Bike, CheckCircle2, MessageCircle, Plus, Store } from "lucide-react";');
  else if (!v.includes('CheckCircle2')) v = v.split('from "lucide-react";').join(', AlertTriangle, Bike, CheckCircle2, MessageCircle, Plus, Store } from "lucide-react";').replace('import {, ', 'import { ');
  v = v.split('<h2 className="font-display text-xl font-bold">🏪 My shops</h2>').join('<h2 className="flex items-center gap-2 font-display text-xl font-bold"><Store className="size-5 text-accent-deep" /> My shops</h2>');
  v = v.split('<h2 className="font-display text-xl font-bold">➕ Add a product</h2>').join('<h2 className="flex items-center gap-2 font-display text-xl font-bold"><Plus className="size-5 text-accent-deep" /> Add a product</h2>');
  v = v.split('params={{ vendorId: vendor.id, buyerId: g.buyer_id }}>💬 Chat</Link>').join('params={{ vendorId: vendor.id, buyerId: g.buyer_id }}><MessageCircle className="size-4" /> Chat</Link>');
  v = v.split('<p className="text-xs font-semibold text-accent-deep">🛵 Delivery: {g.delivery_status}</p>').join('<p className="flex items-center gap-1 text-xs font-semibold text-accent-deep"><Bike className="size-3.5" /> Delivery: {g.delivery_status}</p>');
  v = v.split('<p className="text-xs font-semibold text-success">✅ PAID via {g.payment_method || "M-Pesa"} · ref {String(g.payment_ref).slice(0, 8)}</p>').join('<p className="flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="size-3.5" /> PAID via {g.payment_method || "M-Pesa"} · ref {String(g.payment_ref).slice(0, 8)}</p>');
  v = v.split('<p className="text-xs font-semibold text-success">✅ PAID</p>').join('<p className="flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 className="size-3.5" /> PAID</p>');
  v = v.split('<p className="text-xs font-semibold text-warning">⚠️ Buyer claims direct payment - check your M-Pesa SMS before fulfilling</p>').join('<p className="flex items-center gap-1 text-xs font-semibold text-warning"><AlertTriangle className="size-3.5" /> Buyer claims direct payment - check your M-Pesa SMS before fulfilling</p>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('vendor: icons');
}
let orders = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');
if (orders.includes('🛵')) {
  orders = orders.split('import { MessageCircle, ReceiptText, Trash2 } from "lucide-react";').join('import { Bike, MessageCircle, ReceiptText, Trash2 } from "lucide-react";');
  orders = orders.split('<p className="mt-1 text-xs font-semibold text-accent-deep">🛵 Delivery: {o.delivery_status}</p>').join('<p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent-deep"><Bike className="size-3.5" /> Delivery: {o.delivery_status}</p>');
  fs.writeFileSync('src/routes/_authenticated/orders.tsx', orders);
  console.log('orders: icons');
}
let checkout = fs.readFileSync('src/routes/checkout.tsx', 'utf8');
if (checkout.includes('🛵')) {
  if (!checkout.includes('import { Bike }')) checkout = checkout.split('import { toast } from "sonner";').join('import { Bike } from "lucide-react";\nimport { toast } from "sonner";');
  checkout = checkout.split('🛵 I need a Soko47 rider (+KSh 150)').join('<Bike className="size-4" /> I need a Soko47 rider (+KSh 150)');
  fs.writeFileSync('src/routes/checkout.tsx', checkout);
  console.log('checkout: icons');
}
let prof = fs.readFileSync('src/routes/_authenticated/profile.tsx', 'utf8');
if (prof.includes('🤖') || prof.includes('🔒')) {
  prof = prof.split('import { User } from "lucide-react";').join('import { Bot, Lock, User } from "lucide-react";');
  prof = prof.split('<Label>🤖 Auto-reply message</Label>').join('<Label className="flex items-center gap-1"><Bot className="size-4" /> Auto-reply message</Label>');
  prof = prof.split('🔒 Private - only YOU can view & edit this page. Nobody else can touch your profile.').join('<span className="inline-flex items-center gap-1"><Lock className="size-3.5" /> Private - only YOU can view & edit this page. Nobody else can touch your profile.</span>');
  fs.writeFileSync('src/routes/_authenticated/profile.tsx', prof);
  console.log('profile: icons');
}
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
if (pay.includes('💵') || pay.includes('📲')) {
  pay = pay.split('import { Copy, ExternalLink, Phone } from "lucide-react";').join('import { Banknote, Copy, ExternalLink, Phone, Smartphone } from "lucide-react";');
  pay = pay.split('💵 I paid directly (cash / M-Pesa to trader)').join('<Banknote className="size-4" /> I paid directly (cash / M-Pesa to trader)');
  pay = pay.split('<Label>📲 M-Pesa number to receive the prompt</Label>').join('<Label className="flex items-center gap-1"><Smartphone className="size-4" /> M-Pesa number to receive the prompt</Label>');
  fs.writeFileSync('src/routes/pay.$id.tsx', pay);
  console.log('pay: icons');
}
let chat = fs.readFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', 'utf8');
if (chat.includes('🎥') || chat.includes('📷') || chat.includes('✏️') || chat.includes('🚫') || chat.includes('🔒') || chat.includes('✉️') || chat.includes('📨')) {
  chat = chat.split('import { Copy, Download, Pencil, Send, Trash2, X } from "lucide-react";').join('import { Copy, Download, Lock, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";');
  chat = chat.split('(attach.type === "video" ? "🎥 Video" : "📷 Photo")').join('(attach.type === "video" ? "Video" : "Photo")');
  chat = chat.split('{attach.type === "video" ? "🎥 Ready" : "📷 Ready"}').join('{attach.type === "video" ? "Video ready" : "Photo ready"}');
  chat = chat.split('(isMine ? "✉️ Your message selected" : "📨 Their message selected")').join('(isMine ? "Your message selected" : "Their message selected")');
  chat = chat.split('<div className="text-xs opacity-70">💬</div>').join('<MessageCircle className="size-4 opacity-70" />');
  chat = chat.split('<p className="pt-10 text-center text-sm text-muted-foreground">🔒 Say habari to start the chat.</p>').join('<p className="flex items-center justify-center gap-1 pt-10 text-center text-sm text-muted-foreground"><Lock className="size-3.5" /> Messages are private - say habari to start.</p>');
  chat = chat.split('✏️ Edit MY profile (only you can edit it)').join('<Pencil className="size-3.5" /> Edit my profile (only you can edit it)');
  chat = chat.split('🚫 Clear chat').join('<Trash2 className="size-4" /> Clear chat');
  fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', chat);
  console.log('chat: icons');
}
console.log('DONE - all emojis replaced with professional icons');