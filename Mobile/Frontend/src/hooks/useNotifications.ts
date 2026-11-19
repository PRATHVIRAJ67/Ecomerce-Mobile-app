import { ORDER_STATUS_LABELS, type OrderStatus } from '@ecommerce/shared';
import { useMemo } from 'react';
import { useOrderList, type OrderListItem } from '@/lib/queries';
import { usePrefs } from '@/store';
import { useAuth } from './useAuth';

export interface OrderUpdate {
  id: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  title: string;
  body: string;
  at: string;
  unread: boolean;
}

const COPY: Record<OrderStatus, (o: OrderListItem) => string> = {
  pending_payment: () => 'Complete your payment to confirm this order.',
  confirmed: () => 'We’ve received your order and are getting it ready.',
  packed: () => 'Your order is packed and waiting for pickup.',
  shipped: () => 'Your order is on its way.',
  out_for_delivery: () => 'Your order is out for delivery today.',
  delivered: () => 'Delivered. We hope you love it!',
  cancelled: (o) => o.cancel_reason ?? 'This order was cancelled.',
};

/**
 * In-app notification feed built from real order status changes (GET /me/orders).
 * Push notifications need a device-token table + sender on the backend — see TODO.md.
 */
export function useOrderUpdates() {
  const { isSignedIn } = useAuth();
  const seenAt = usePrefs((s) => s.notificationsSeenAt);
  const q = useOrderList(isSignedIn);
  const updates = useMemo<OrderUpdate[]>(() => {
    const orders = q.data?.pages.flatMap((p) => p.items) ?? [];
    return orders
      .map((o) => ({
        id: `${o.id}-${o.status}`,
        orderId: o.id,
        orderNumber: o.order_number,
        status: o.status,
        title: `${ORDER_STATUS_LABELS[o.status]} · ${o.order_number}`,
        body: COPY[o.status](o),
        at: o.updated_at,
        unread: !seenAt || new Date(o.updated_at) > new Date(seenAt),
      }))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [q.data, seenAt]);
  return { updates, unread: updates.filter((u) => u.unread).length, query: q };
}
