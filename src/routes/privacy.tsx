import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Privacy });

const S: { h: string; p: string[] }[] = [
  { h: "1. Our commitment", p: ["Soko47 respects your privacy and processes your personal data in line with the Data Protection Act, 2019 (Kenya)."] },
  { h: "2. Data we collect", p: ["Account details (name, email, phone); trader details (shop name, market, stall, phone, WhatsApp and photos); order details (items, delivery area, notes and receipts); messages and reviews you post; and basic technical data (device type and logs) needed to keep the service secure."] },
  { h: "3. How we use your data", p: ["To operate orders and receipts; to send notifications about your orders and the shops you follow; to provide support and resolve disputes; to prevent fraud and abuse; to improve the marketplace; and to comply with the law."] },
  { h: "4. Who we share it with", p: ["Vendors see the buyer name, phone and delivery details needed to fulfil an order. Payments are handled by licensed providers such as Safaricom M-Pesa. Data is hosted on secure infrastructure operated by Supabase and Vercel. We may disclose data to authorities where the law requires it. We do not sell your personal data."] },
  { h: "5. Storage and security", p: ["Data is encrypted in transit over HTTPS and protected by row-level access controls so that only you, the relevant trader and, where necessary, our support team can see it. No system is 100 percent secure, but we work hard to protect your data."] },
  { h: "6. Your rights", p: ["Under the Data Protection Act, 2019 you may access, correct or request deletion of your personal data, object to certain processing, and withdraw consent at any time. Email us and we will act within 30 days. You may also lodge a complaint with the Office of the Data Protection Commissioner (ODPC)."] },
  { h: "7. Cookies and local storage", p: ["We use minimal local storage to keep you signed in and to remember your cart. We do not use advertising trackers."] },
  { h: "8. Retention", p: ["We keep account data while your account is active, and order and receipt records for as long as needed for accounting and legal purposes."] },
  { h: "9. Children", p: ["Soko47 is not directed to persons under 18 years of age."] },
  { h: "10. Changes and contact", p: ["We may update this policy; material changes will be announced in the app. Contact: njorastephen1@gmail.com - Soko47, Nairobi, Kenya."] },
];

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pb-28">
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 September 2026</p>
      <div className="mt-8 space-y-6">
        {S.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-bold">{s.h}</h2>
            {s.p.map((t, i) => (<p key={i} className="mt-2 text-sm leading-6 text-muted-foreground">{t}</p>))}
          </section>
        ))}
      </div>
    </div>
  );
}
