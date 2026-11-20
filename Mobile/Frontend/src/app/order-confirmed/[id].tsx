import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressLine } from '@/components/AddressForm';
import { OrderTimeline } from '@/components/OrderTimeline';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Card, Display, ErrorState, Loading, Row, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { formatDateTime, formatINR } from '@/lib/format';
import { useOrder } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function ConfirmedScreen() {
  return (
    <RequireAuth>
      <Confirmed />
    </RequireAuth>
  );
}

function Confirmed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const q = useOrder(id);
  const scale = useSharedValue(reduced ? 1 : 0.3);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    if (!reduced) scale.set(withDelay(120, withSpring(1, { damping: 9, stiffness: 140 })));
  }, [reduced, scale]);

  if (q.isPending) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const o = q.data;
  const awaiting = o.status === 'pending_payment';

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30, paddingHorizontal: 20 }}>
      <View className="items-center">
        <AView style={[{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center', borderRadius: 56, backgroundColor: awaiting ? '#FCF3DC' : C.forest }, ring]}>
          {awaiting ? <Clock size={48} color={C.warning} /> : <Check size={54} color={C.cream} strokeWidth={2.6} />}
        </AView>
        <Display className="mt-7 text-center text-[32px] leading-[38px]">{awaiting ? 'Almost there…' : 'Thank you!'}</Display>
        <Txt className="mt-2 text-center text-[15px] text-ink-soft">{awaiting ? 'We’re waiting for your payment to be confirmed.' : 'Your order is placed and we’re getting it ready.'}</Txt>
        <View className="mt-4 rounded-full bg-white px-4 py-2">
          <Txt weight="semibold" className="text-[13px]">
            Order {o.order_number} · {formatDateTime(o.placed_at)}
          </Txt>
        </View>
      </View>

      <Card className="mt-8">
        <OrderTimeline order={o} />
      </Card>

      <Card className="mt-4">
        <Txt weight="semibold" className="mb-1 text-[12px] uppercase tracking-[1.6px] text-muted">
          Delivering to
        </Txt>
        <Txt weight="semibold">{o.shipping_address.full_name}</Txt>
        <Txt className="mt-0.5 text-[13.5px] leading-[19px] text-ink-soft">{addressLine(o.shipping_address)}</Txt>
        <View className="my-4 h-px bg-line" />
        <Row label={`Items (${o.item_count})`} value={formatINR(o.subtotal)} />
        <Row label="Delivery" value={o.shipping_fee ? formatINR(o.shipping_fee) : 'Free'} />
        <Row label="Total" value={formatINR(o.total)} strong />
        <Txt className="mt-3 text-[13px] text-ink-soft">
          {o.payment_method === 'cod' ? `Please keep ${formatINR(o.total)} ready — pay in cash or UPI on delivery.` : o.payment_status === 'paid' ? 'Paid online via Razorpay.' : 'Online payment pending.'}
        </Txt>
      </Card>

      <View className="mt-6 gap-3">
        <Button title={awaiting ? 'Complete payment' : 'Track this order'} size="lg" onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: o.id } })} />
        <Button title="Continue shopping" size="lg" variant="outline" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}
