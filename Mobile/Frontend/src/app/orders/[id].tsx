import { CUSTOMER_CANCELLABLE, type Order } from '@ecommerce/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, PackageSearch, CircleX } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressLine } from '@/components/AddressForm';
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from '@/components/OrderTimeline';
import { ProductImage } from '@/components/product/ProductImage';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Card, Display, EmptyState, ErrorState, Loading, Row, ScreenHeader, Txt } from '@/components/ui';
import { Sheet } from '@/components/ui/Sheet';
import { api, errorMessage, isNotFound } from '@/lib/api';
import { formatDateTime, formatINR } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { keys, useOrder, useSettings } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';
import { toast } from '@/store';

export default function OrderScreen() {
  return (
    <RequireAuth title="Order">
      <OrderDetail />
    </RequireAuth>
  );
}

function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: settings } = useSettings();
  const q = useOrder(id, true); // polls every 30s while open → live tracking
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  if (q.isPending) return <Loading />;
  if (isNotFound(q.error)) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Order" />
        <EmptyState icon={PackageSearch} title="Order not found" action={<Button title="Your orders" onPress={() => router.replace('/orders')} />} />
      </View>
    );
  }
  if (q.error || !q.data) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Order" />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </View>
    );
  }

  const o = q.data;
  const canCancel = CUSTOMER_CANCELLABLE.includes(o.status);
  const canPay = o.status === 'pending_payment' && o.payment_method === 'razorpay' && settings?.online_payments_available;

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await api.post<Order>(`/me/orders/${o.id}/cancel`, { reason: reason.trim() || null });
      queryClient.setQueryData(keys.order(o.id), updated);
      void queryClient.invalidateQueries({ queryKey: keys.orders });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
      haptic.success();
      toast.success('Your order has been cancelled');
      setCancelOpen(false);
    } catch (e) {
      haptic.error();
      toast.error(errorMessage(e));
      void q.refetch();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={o.order_number} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + (canPay || canCancel ? 120 : 30) }} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={C.forest} />}>
        <View>
          <View className="flex-row items-center gap-2">
            <Display className="text-[26px]">Tracking</Display>
            <OrderStatusBadge status={o.status} />
          </View>
          <Txt className="mt-1 text-[13px] text-muted">Placed {formatDateTime(o.placed_at)} · pull down to refresh</Txt>
        </View>
        <Card>
          <OrderTimeline order={o} />
          {o.delivered_at ? <Txt className="text-[13px] text-success">Delivered on {formatDateTime(o.delivered_at)}</Txt> : null}
        </Card>

        <Card>
          <Txt className="mb-3 font-display text-[19px] text-ink">Items</Txt>
          {(o.items ?? []).map((i) => (
            <View key={i.id} className="mb-3 flex-row items-center gap-3">
              <ProductImage uri={i.image_url} seed={i.product_name} hints={[i.product_name]} style={{ width: 54, height: 54, borderRadius: 14 }} />
              <View className="flex-1">
                <Txt weight="medium" className="text-[14px]" numberOfLines={2}>
                  {i.product_name}
                </Txt>
                <Txt className="text-[12px] text-muted">
                  {i.quantity} × {formatINR(i.unit_price)}
                  {i.unit ? ` · ${i.unit}` : ''}
                </Txt>
              </View>
              <Txt weight="semibold">{formatINR(i.line_total)}</Txt>
            </View>
          ))}
          <View className="my-2 h-px bg-line" />
          <Row label="Subtotal" value={formatINR(o.subtotal)} />
          {o.discount > 0 ? <Row label="Discount" value={`−${formatINR(o.discount)}`} valueClassName="text-success" /> : null}
          <Row label="Delivery" value={o.shipping_fee ? formatINR(o.shipping_fee) : 'Free'} />
          <Row label="Total" value={formatINR(o.total)} strong />
        </Card>

        <Card>
          <Txt className="mb-2 font-display text-[19px] text-ink">Delivery</Txt>
          <Txt weight="semibold">{o.shipping_address.full_name}</Txt>
          <Txt className="mt-0.5 text-[13.5px] leading-[19px] text-ink-soft">{addressLine(o.shipping_address)}</Txt>
          <Txt className="mt-0.5 text-[13.5px] text-ink-soft">Phone: {o.shipping_address.phone}</Txt>
          {o.notes ? <Txt className="mt-3 rounded-xl bg-cream p-3 text-[13px] text-ink-soft">Your note: {o.notes}</Txt> : null}
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <Txt className="font-display text-[19px] text-ink">Payment</Txt>
            <PaymentStatusBadge status={o.payment_status} />
          </View>
          <Txt className="mt-1 text-[13.5px] text-ink-soft">{o.payment_method === 'cod' ? 'Cash on Delivery' : 'Online · Razorpay'}</Txt>
          {o.paid_at ? <Txt className="text-[12px] text-muted">Paid {formatDateTime(o.paid_at)}</Txt> : null}
        </Card>

        <Button title="Need help with this order?" variant="ghost" onPress={() => router.push('/support')} />
      </ScrollView>

      {canPay || canCancel ? (
        <View className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-line bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {canCancel ? <Button title="Cancel order" icon={CircleX} variant="danger" size="lg" className="flex-1" onPress={() => setCancelOpen(true)} /> : null}
          {canPay ? <Button title={`Pay ${formatINR(o.total)}`} icon={CreditCard} variant="accent" size="lg" className="flex-1" onPress={() => router.push({ pathname: '/payment/[id]', params: { id: o.id } })} /> : null}
        </View>
      ) : null}

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        footer={
          <View className="flex-row gap-3">
            <Button title="Keep order" variant="outline" className="flex-1" onPress={() => setCancelOpen(false)} />
            <Button title="Yes, cancel" variant="danger" className="flex-1" loading={cancelling} onPress={() => void cancel()} />
          </View>
        }
      >
        <Txt className="text-[14px] leading-[20px] text-ink-soft">{o.payment_status === 'paid' ? 'Your payment will be refunded to the original payment method.' : 'Nothing has been charged for this order.'}</Txt>
        <Txt weight="medium" className="mb-1.5 mt-4 text-[13px] text-ink-soft">
          Reason <Txt className="text-[13px] text-muted">(optional)</Txt>
        </Txt>
        <TextInput value={reason} onChangeText={setReason} maxLength={300} multiline placeholder="Help us improve" placeholderTextColor={C.muted} accessibilityLabel="Cancellation reason" className="min-h-[90px] rounded-2xl border border-line bg-white p-4 font-sans text-[15px] text-ink" style={{ textAlignVertical: 'top' }} />
      </Sheet>
    </View>
  );
}
