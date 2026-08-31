import fs from 'fs';

const TERMS = `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({ component: Terms });

const S: { h: string; p: string[] }[] = [
  { h: "1. What Soko47 is", p: ["Soko47 is an online marketplace that connects buyers with independent traders (vendors) across Kenya. We provide the platform; we do not own, stock or sell the goods listed. Every purchase is a contract between the buyer and the vendor."] },
  { h: "2. Accounts", p: ["You must give accurate information when creating an account and keep your login details private. You are responsible for all activity under your account. You must be 18 years or older to trade on Soko47."] },
  { h: "3. Buying on Soko47", p: ["Placing an order is an offer to buy goods from a vendor. Payment is made as shown at checkout - pay on delivery or pickup, or by M-Pesa where available. Please inspect your goods at delivery or pickup and raise any issue with the vendor promptly through the in-app chat."] },
  { h: "4. Returns, refunds and issues", p: ["Because goods are sold by independent traders, returns and exchanges are first handled between buyer and vendor. Where an order was prepaid through the platform and the goods are faulty or not delivered, the vendor must replace them or refund. Use the in-app chat or contact support if a vendor does not resolve a genuine issue."] },
  { h: "5. Selling on Soko47", p: ["Vendors must list goods accurately (price, stock, condition and photos), sell only lawful goods they have the right to sell, and fulfil accepted orders promptly. Trader shops begin with a free trial, then pay a subscription from KSh 300 per month. Soko47 may suspend or remove shops that break these rules."] },
  { h: "6. Payments and fees", p: ["Buyers pay no platform fee. Vendors pay the applicable subscription fee. M-Pesa and other payment transactions are processed by licensed providers and are subject to those providers' terms."] },
  { h: "7. Delivery and pickup", p: ["Delivery or pickup (boda rider, matatu parcel or walk-in) is agreed between buyer and vendor. Soko47 is not a courier and is not responsible for goods once they leave the vendor's stall, except where the platform has collected payment on the vendor's behalf."] },
  { h: "8. Reviews and acceptable conduct", p: ["Reviews must be truthful and based on real orders. Fraud, counterfeit or illegal goods, harassment, spam, and attempts to bypass the platform to avoid fees are prohibited and may lead to suspension."] },
  { h: "9. Our liability", p: ["The platform is provided as is. To the maximum extent permitted by law, Soko47 is not liable for the quality, safety or legality of goods sold by vendors, or for losses arising from transactions between users. Nothing in these terms limits liability that cannot be limited under Kenyan law."] },
  { h: "10. Suspension and changes", p: ["We may suspend accounts that breach these terms. We may update these terms from time to time; continuing to use Soko47 after changes means you accept the new terms."] },
  { h: "11. Governing law and contact", p: ["These terms are governed by the laws of the Republic of Kenya. Questions: njorastephen1@gmail.com - Soko47, Nairobi, Kenya."] },
];

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pb-28">
      <h1 className="font-display text-3xl font-bold">Terms & Conditions</h1>
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
`;

const PRIVACY = `import { createFileRoute } from "@tanstack/react-router";

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
`;

fs.writeFileSync('src/routes/terms.tsx', TERMS);
fs.writeFileSync('src/routes/privacy.tsx', PRIVACY);
console.log('terms.tsx + privacy.tsx created');

// Add footer links
for (const f of ['src/components/site-chrome.tsx', 'src/routes/__root.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('</footer>') && c.includes('Link')) {
    c = c.replace('</footer>', '<div className="mt-6 flex flex-wrap gap-4 text-xs opacity-80"><Link to="/terms">Terms & Conditions</Link><Link to="/privacy">Privacy Policy</Link></div></footer>');
    fs.writeFileSync(f, c);
    console.log('footer links added in', f);
    break;
  }
}