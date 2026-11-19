import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type Order, type OrderStatus, type PaymentStatus } from '@ecommerce/shared';
import { Check, CircleDot, Clock, House, PackageCheck, PackageOpen, Truck, CircleX, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { formatDateTime } from '@/lib/format';
import { C } from '@/lib/theme';
import { Badge, Txt } from './ui';

const STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
  { status: 'confirmed', label: 'Order confirmed', icon: CircleDot },
  { status: 'packed', label: 'Packed', icon: PackageOpen },
  { status: 'shipped', label: 'Shipped', icon: PackageCheck },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: House },
];

const TONE: Record<OrderStatus, 'forest' | 'success' | 'warning' | 'danger'> = {
  pending_payment: 'warning',
  confirmed: 'forest',
  packed: 'forest',
  shipped: 'forest',
  out_for_delivery: 'forest',
  delivered: 'success',
  cancelled: 'danger',
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={TONE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === 'paid' ? 'success' : status === 'failed' ? 'danger' : status === 'pending' ? 'neutral' : 'warning';
  return <Badge tone={tone}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

/** Vertical tracking timeline driven by the order's real status history. */
export function OrderTimeline({ order }: { order: Order }) {
  const history = order.history ?? [];
  const at = (s: OrderStatus) => history.filter((h) => h.status === s).at(-1)?.created_at;

  if (order.status === 'cancelled') {
    return (
      <View className="flex-row gap-3">
        <CircleX size={22} color={C.danger} />
        <View className="flex-1">
          <Txt weight="semibold" className="text-danger">
            Order cancelled
          </Txt>
          <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-soft">
            {order.cancel_reason ?? 'This order was cancelled.'}
            {order.cancelled_at ? ` · ${formatDateTime(order.cancelled_at)}` : ''}
          </Txt>
          {order.payment_status === 'refund_pending' ? <Txt className="mt-1 text-[13px] text-ink-soft">Your refund is being processed to the original payment method.</Txt> : null}
          {order.payment_status === 'refunded' ? <Txt className="mt-1 text-[13px] text-ink-soft">Your payment has been refunded.</Txt> : null}
        </View>
      </View>
    );
  }
  if (order.status === 'pending_payment') {
    return (
      <View className="flex-row gap-3">
        <Clock size={22} color={C.warning} />
        <View className="flex-1">
          <Txt weight="semibold" className="text-warning">
            Awaiting payment
          </Txt>
          <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-soft">Complete payment to confirm this order. Unpaid orders are cancelled automatically after a short while and the items are released.</Txt>
        </View>
      </View>
    );
  }

  const current = STEPS.findIndex((s) => s.status === order.status);
  return (
    <View accessibilityLabel={`Order progress: ${ORDER_STATUS_LABELS[order.status]}`}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        const when = at(step.status);
        const Icon = done && !isCurrent ? Check : step.icon;
        return (
          <View key={step.status} className="flex-row gap-3.5" accessible accessibilityLabel={`${step.label}${done ? ', completed' : ', upcoming'}${when ? `, ${formatDateTime(when)}` : ''}`}>
            <View className="items-center">
              <View className={`h-9 w-9 items-center justify-center rounded-full ${isCurrent ? 'bg-terracotta-500' : done ? 'bg-forest-700' : 'bg-cream-dark'}`}>
                <Icon size={16} color={done ? C.cream : C.muted} strokeWidth={2.2} />
              </View>
              {i < STEPS.length - 1 ? <View className={`w-0.5 flex-1 ${i < current ? 'bg-forest-700' : 'bg-line'}`} style={{ minHeight: 22 }} /> : null}
            </View>
            <View className="flex-1 pb-5 pt-1.5">
              <Txt weight={isCurrent ? 'bold' : done ? 'semibold' : 'regular'} className={done ? 'text-[14.5px]' : 'text-[14.5px] text-muted'}>
                {step.label}
              </Txt>
              {when ? <Txt className="text-[12px] text-muted">{formatDateTime(when)}</Txt> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
