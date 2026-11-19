import { formatINR } from './format';
import type { StoreSettings } from './queries';

/** Help & policy copy. Same content as the website; amounts come from live store settings. */
export interface Doc {
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

export function faqs(s?: StoreSettings): { q: string; a: string }[] {
  const fee = s?.shipping_fee != null ? formatINR(s.shipping_fee) : 'a small fee';
  const free = s?.free_shipping_threshold ? formatINR(s.free_shipping_threshold) : null;
  return [
    { q: 'How much is delivery?', a: free ? `Delivery is free on orders of ${free} or more. Below that, a flat fee of ${fee} applies. You'll always see the exact amount before you pay.` : `A delivery fee of ${fee} applies and is shown before you pay.` },
    { q: 'Which payment methods do you accept?', a: `${s?.online_payments_available ? 'UPI, cards, netbanking and wallets through Razorpay. ' : ''}${s?.cod_enabled !== false ? `Cash on Delivery${s?.cod_max_order_value ? ` for orders up to ${formatINR(s.cod_max_order_value)}` : ''}.` : ''}`.trim() },
    { q: 'Is online payment safe?', a: 'Yes. Payments are processed by Razorpay, a PCI-DSS compliant gateway. We never see your card details, and every payment is verified by our server before your order is confirmed.' },
    { q: 'How do I track my order?', a: 'Open You → Your orders. Each order shows live status — confirmed, packed, shipped, out for delivery and delivered — with times. You’ll also see updates under Notifications.' },
    { q: 'Can I cancel my order?', a: 'Yes, from the order page while it is awaiting payment or confirmed (before packing). After that, contact us and we’ll do our best to help.' },
    { q: 'What if something goes out of stock?', a: 'Stock is checked again when you place the order. If an item is no longer available we’ll tell you before you pay — you’re never charged for something we can’t send.' },
    { q: 'Do I need an account?', a: 'You can browse and save items without one. To check out and track orders you’ll need to sign in, so your orders stay private.' },
  ];
}

export const POLICY_SLUGS = ['shipping', 'returns', 'cancellation', 'privacy', 'terms'] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export function policy(slug: PolicySlug, s?: StoreSettings): Doc {
  switch (slug) {
    case 'shipping':
      return {
        title: 'Shipping & delivery',
        summary: 'Delivery charges, timelines and packing.',
        sections: [
          {
            heading: 'Delivery charges',
            body: [
              s?.free_shipping_threshold
                ? `Orders with a subtotal of ${formatINR(s.free_shipping_threshold)} or more ship free. Below that, a flat fee of ${formatINR(s.shipping_fee ?? 0)} is added. The exact charge is always shown before you pay.`
                : `A flat delivery fee of ${formatINR(s?.shipping_fee ?? 0)} applies to each order and is shown before you pay.`,
            ],
          },
          { heading: 'Dispatch and delivery times', body: ['Most orders are packed within 1–2 business days. Fresh and seasonal produce may ship on specific days to arrive at its best. You can follow every step on your order page.'] },
          { heading: 'Packaging', body: ['We pack by hand using sturdy, minimal packaging. Fragile items such as clay and glass are cushioned individually.'] },
        ],
      };
    case 'returns':
      return {
        title: 'Returns & refunds',
        summary: 'What to do if something arrives damaged or incorrect.',
        sections: [
          { heading: 'Damaged, defective or incorrect items', body: ['Contact us within 48 hours of delivery with your order number and a photo. We will arrange a replacement or a refund.'] },
          { heading: 'Perishable goods', body: ['For hygiene and food-safety reasons, perishable and opened food items cannot be returned unless they arrive damaged or spoiled.'] },
          { heading: 'Non-food items', body: ['Unused handloom, kitchenware and handicraft items in original packaging may be returned within 7 days of delivery. Some handmade variation is natural and not a defect.'] },
          { heading: 'Refunds', body: ['Approved refunds for online payments go back to the original payment method, usually within 5–7 business days. For Cash on Delivery orders we refund to a bank account or UPI ID you provide.'] },
        ],
      };
    case 'cancellation':
      return {
        title: 'Cancellation',
        summary: 'When and how you can cancel an order.',
        sections: [
          { heading: 'Cancelling your order', body: ['You can cancel from the order page while it is awaiting payment or confirmed. Once packed, contact us — it may already be on its way.'] },
          { heading: 'Unpaid online orders', body: ['If you choose online payment and don’t complete it, the order is held briefly and then cancelled automatically so the items become available to others.'] },
          { heading: 'Refunds on cancelled orders', body: ['If you had already paid online, a refund is initiated to the original payment method as soon as the order is cancelled.'] },
        ],
      };
    case 'privacy':
      return {
        title: 'Privacy policy',
        summary: 'How URU collects, uses and protects your information.',
        sections: [
          { heading: 'What we collect', body: ['Your name, email and (if you add it) phone number; delivery addresses you save; order history, cart and wishlist. Payment status from our payment partner — never full card numbers, UPI PINs or banking passwords.'] },
          { heading: 'How we use it', body: ['Only to run the store: process and deliver orders, show your order history, contact you about orders and keep the service secure. We do not sell your personal data.'] },
          { heading: 'Who we share it with', body: ['Delivery partners (name, phone and address), our payment gateway, and the service providers that host our systems — each only as needed.'] },
          { heading: 'Security', body: ['Your sign-in session is stored in your phone’s secure keychain/keystore, connections are encrypted, and access to customer data is restricted to authorised staff.'] },
          { heading: 'Your choices', body: ['Update your profile and addresses any time from the app. To request a copy or deletion of your data, contact support.'] },
        ],
      };
    case 'terms':
      return {
        title: 'Terms of service',
        summary: 'The terms that apply when you shop on URU.',
        sections: [
          { heading: 'Using URU', body: ['By creating an account or placing an order you agree to these terms. Keep your login details safe; you are responsible for activity on your account.'] },
          { heading: 'Products and prices', body: ['Prices are in Indian Rupees and include applicable taxes. Handmade and natural products can vary slightly. Prices and availability are confirmed by our system when you place your order.'] },
          { heading: 'Orders', body: [`An order is confirmed when placed with Cash on Delivery or once online payment is verified.${s?.max_quantity_per_item ? ` Quantities may be limited (currently up to ${s.max_quantity_per_item} per product).` : ''}`] },
          { heading: 'Payments', body: [`Online payments are processed securely by Razorpay.${s?.cod_max_order_value ? ` Cash on Delivery is available for orders up to ${formatINR(s.cod_max_order_value)}.` : ''}`] },
        ],
      };
  }
}
