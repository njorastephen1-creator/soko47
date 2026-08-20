import fs from 'fs';
let receipt = fs.readFileSync('src/routes/_authenticated/receipt.$id.tsx', 'utf8');
let n = 0;
if (receipt.includes('.select("shop_name, market_name, slug, user_id")')) {
  receipt = receipt.split('.select("shop_name, market_name, slug, user_id")').join('.select("shop_name, market_name, slug, user_id, phone, whatsapp")');
  n++;
}
if (receipt.includes('<p className="mt-1 text-muted-foreground">The trader is already preparing your goods - asante for shopping local! 🇰</p>')) {
  receipt = receipt.split('<p className="mt-1 text-muted-foreground">The trader is already preparing your goods - asante for shopping local! 🇰</p>').join('<p className="mt-1 text-muted-foreground">The trader is already preparing your goods - asante for shopping local! 🇰</p>\n            {vendor && vendor.phone ? (\n              <div className="mt-2 flex flex-wrap gap-2">\n                <a href={"tel:" + vendor.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">📞 Call {vendor.shop_name}</a>\n                {vendor.whatsapp ? <a href={"https://wa.me/" + vendor.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">WhatsApp trader</a> : null}\n              </div>\n            ) : null}');
  n++;
}
if (n > 0) { fs.writeFileSync('src/routes/_authenticated/receipt.$id.tsx', receipt); console.log('Receipt: trader contacts added'); }
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (chrome.includes('<div className="hidden shrink-0 sm:block"><NotificationsBell /></div>')) {
  chrome = chrome.split('<div className="hidden shrink-0 sm:block"><NotificationsBell /></div>').join('<div className="shrink-0"><NotificationsBell /></div>');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Bell now visible on mobile');
}
console.log('DONE');