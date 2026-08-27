import fs from 'fs';
const f = 'src/routes/checkout.tsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the submit function entirely
const OLD_SUBMIT = `  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.buyer_name.trim().length < 2) return toast.error("Enter your name");
    if (form.buyer_phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    if (form.delivery_location.trim().length < 3) return toast.error("Where should the goods go?");
    if (!session) { toast.error("Please sign in to place an order"); navigate({ to: "/auth" }); return; }
    setSaving(true);
    const { data: order, error } = await supabase.from("orders").insert({ buyer_id: session.user.id, buyer_name: form.buyer_name.trim(), buyer_phone: form.buyer_phone.trim(), delivery_location: form.delivery_location.trim(), note: form.note.trim() || null, total_kes: total, delivery_fee_kes: needRider ? 150 : 0, delivery_status: needRider ? "requested" : "none" }).select().single();
    if (error || !order) { setSaving(false); toast.error(error?.message ?? "Could not place the order"); return; }
    const { error: itemsError } = await supabase.from("order_items").insert(items.map((i) => ({ order_id: order.id, product_id: i.productId, vendor_id: i.vendorId, title: i.title, unit_price_kes: i.price, quantity: i.quantity })));
    setSaving(false);
    if (itemsError) { toast.error(itemsError.message); return; }
    clearCart();
    toast.success("Order placed — the traders will contact you shortly");
    navigate({ to: "/pay/$id", params: { id: order.id } });
  };`;

const NEW_SUBMIT = `  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.buyer_name.trim().length < 2) return toast.error("Enter your name");
    if (form.buyer_phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Enter a valid Kenyan phone number");
    if (form.delivery_location.trim().length < 3) return toast.error("Where should the goods go?");
    if (!session) { toast.error("Please sign in to place an order"); navigate({ to: "/auth" }); return; }
    setSaving(true);
    try {
      const payload = {
        p_buyer_name: form.buyer_name.trim(),
        p_buyer_phone: form.buyer_phone.trim(),
        p_delivery_location: form.delivery_location.trim(),
        p_note: form.note.trim() || null,
        p_delivery_fee_kes: needRider ? 150 : 0,
        p_items: items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      };
      const { data, error } = await supabase.rpc("create_order", payload);
      if (error) throw error;
      clearCart();
      toast.success("Order placed — the traders will contact you shortly");
      navigate({ to: "/pay/$id", params: { id: (data as any).order_id } });
    } catch (err: any) {
      setSaving(false);
      toast.error(err?.message || "Could not place the order");
    }
  };`;

if (c.includes(OLD_SUBMIT)) {
  c = c.split(OLD_SUBMIT).join(NEW_SUBMIT);
  fs.writeFileSync(f, c);
  console.log('checkout: submit function replaced with atomic RPC call');
} else {
  console.log('submit block not matched exactly — printing submit region:');
  const i = c.indexOf('const submit =');
  console.log(c.slice(i, i + 1500));
}