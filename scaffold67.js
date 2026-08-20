import fs from 'fs';
let pos = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
let n = 0;
if (pos.includes('select("order_id, qty, price_kes, products(title), orders(*)")')) {
  pos = pos.split('select("order_id, qty, price_kes, products(title), orders(*)")').join('select("order_id, quantity, unit_price_kes, title, orders(*)")');
  n++;
}
if (pos.includes('map[row.order_id].items.push({ title: row.products ? row.products.title : "Item", qty: row.qty, price: Number(row.price_kes) });')) {
  pos = pos.split('map[row.order_id].items.push({ title: row.products ? row.products.title : "Item", qty: row.qty, price: Number(row.price_kes) });').join('map[row.order_id].items.push({ title: row.title || "Item", qty: row.quantity, price: Number(row.unit_price_kes) });');
  n++;
}
if (pos.includes('map[row.order_id].total += Number(row.price_kes) * row.qty;')) {
  pos = pos.split('map[row.order_id].total += Number(row.price_kes) * row.qty;').join('map[row.order_id].total += Number(row.unit_price_kes) * row.quantity;');
  n++;
}
if (n > 0) { fs.writeFileSync('src/routes/_authenticated/pos.tsx', pos); console.log('DONE:', n, 'fixes'); }
else console.log('WARNING: nothing matched');