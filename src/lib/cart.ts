import { useEffect, useState } from "react";
export type CartItem = { productId: string; vendorId: string; shopName: string; title: string; price: number; unit: string; imageUrl?: string | null; quantity: number; };
const KEY = "soko47.cart"; const EVENT = "soko47.cart.changed";
export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { const raw = window.localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as CartItem[]) : []; } catch { return []; }
}
function writeCart(items: CartItem[]) { window.localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event(EVENT)); }
export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = readCart(); const existing = items.find((i) => i.productId === item.productId);
  if (existing) existing.quantity += quantity; else items.push({ ...item, quantity }); writeCart(items);
}
export function setQuantity(productId: string, quantity: number) {
  const items = readCart().map((i) => (i.productId === productId ? { ...i, quantity } : i)).filter((i) => i.quantity > 0); writeCart(items);
}
export function removeFromCart(productId: string) { writeCart(readCart().filter((i) => i.productId !== productId)); }
export function clearCart() { writeCart([]); }
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart()); sync();
    window.addEventListener(EVENT, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, total, count };
}
export const formatKes = (value: number) => `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;