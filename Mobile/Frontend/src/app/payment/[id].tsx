import type { CheckoutResult, Order } from '@ecommerce/shared';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Display, ScreenHeader, Txt } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api, errorMessage } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { keys, useOrder } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { razorpayHtml } from '@/lib/razorpayHtml';
import { C } from '@/lib/theme';

type RazorpayInfo = NonNullable<CheckoutResult['razorpay']>;
type Phase = { kind: 'paying' } | { kind: 'verifying' } | { kind: 'stopped'; message: string; tone: 'info' | 'error' };

export default function PaymentScreen() {
  return (
    <RequireAuth title="Payment">
      <Payment />
    </RequireAuth>
  );
}

function Payment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile, email } = useAuth();
  const order = useOrder(id);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: 'paying' });

  // Creates (or reuses) the Razorpay order on the server. Never trust a client-side amount.
  const pay = useQuery({
    queryKey: ['payment', id, attempt],
    queryFn: () => api.post<{ razorpay: RazorpayInfo }>(`/me/orders/${id}/pay`),
    enabled: Boolean(id) && order.data?.status === 'pending_payment',
    retry: false,
    gcTime: 0,
  });

  const html = useMemo(() => {
    const rp = pay.data?.razorpay;
    const o = order.data;
    if (!rp || !o) return null;
    return razorpayHtml({
      key: rp.key_id,
      order_id: rp.order_id,
      amount: rp.amount,
      currency: rp.currency,
      name: 'URU',
      description: `Order ${o.order_number}`,
      prefill: { name: profile?.full_name ?? o.customer_name ?? undefined, email: email ?? undefined, contact: profile?.phone ?? o.customer_phone ?? undefined },
    });
  }, [pay.data, order.data, profile, email]);

  const onMessage = async (e: WebViewMessageEvent) => {
    let msg: { type: string; message?: string; razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'paid') {
      setPhase({ kind: 'verifying' });
      try {
        const verified = await api.post<Order>(`/me/orders/${id}/verify-payment`, {
          razorpay_order_id: msg.razorpay_order_id,
          razorpay_payment_id: msg.razorpay_payment_id,
          razorpay_signature: msg.razorpay_signature,
        });
        queryClient.setQueryData(keys.order(id!), verified);
        void queryClient.invalidateQueries({ queryKey: keys.orders });
        haptic.success();
        router.replace({ pathname: '/order-confirmed/[id]', params: { id: id! } });
      } catch (err) {
        haptic.error();
        setPhase({ kind: 'stopped', tone: 'error', message: `${errorMessage(err)} If money was debited, it will be confirmed automatically or refunded.` });
      }
    } else if (msg.type === 'failed') {
      haptic.error();
      setPhase({ kind: 'stopped', tone: 'error', message: `Payment failed: ${msg.message}. No money was taken for this attempt.` });
    } else if (msg.type === 'dismissed') {
      setPhase({ kind: 'stopped', tone: 'info', message: 'Payment was not completed. Your items are reserved for a short while.' });
    } else if (msg.type === 'error') {
      setPhase({ kind: 'stopped', tone: 'error', message: msg.message ?? 'Payment window could not open.' });
    }
  };

  const retry = () => {
    setPhase({ kind: 'paying' });
    setAttempt((a) => a + 1);
  };

  const o = order.data;
  const alreadyDone = o && o.status !== 'pending_payment';
  const loadError = order.error ?? pay.error;

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Payment" />
        <Txt className="p-6 text-ink-soft">Online payment opens in the mobile app. Use the website to pay from a browser.</Txt>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Secure payment" onBack={() => router.replace({ pathname: '/orders/[id]', params: { id: id! } })} />
      {phase.kind === 'paying' && html && !alreadyDone ? (
        <WebView
          key={attempt}
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          // UPI apps & bank pages: hand non-web links (upi://, intent://) to the OS.
          onShouldStartLoadWithRequest={(req) => {
            if (/^https?:|^about:|^data:/i.test(req.url)) return true;
            void Linking.openURL(req.url).catch(() => undefined);
            return false;
          }}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={{ flex: 1 }} color={C.forest} />}
          style={{ flex: 1, backgroundColor: C.cream }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8" style={{ paddingBottom: insets.bottom + 20 }}>
          {phase.kind === 'verifying' || (!loadError && !alreadyDone && phase.kind === 'paying') ? (
            <>
              <ActivityIndicator size="large" color={C.forest} />
              <Txt weight="semibold" className="mt-4 text-[16px]">
                {phase.kind === 'verifying' ? 'Confirming your payment…' : 'Preparing secure payment…'}
              </Txt>
              <Txt className="mt-1 text-center text-muted">Please do’ close the app.</Txt>
            </>
          ) : alreadyDone ? (
            <>
              <ShieldCheck size={44} color={C.success} />
              <Display className="mt-4 text-center text-[24px]">This order does’ need payment</Display>
              <Button title="View order" className="mt-6" onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: id! } })} />
            </>
          ) : (
            <>
              <View className={`h-20 w-20 items-center justify-center rounded-full ${phase.kind === 'stopped' && phase.tone === 'info' ? 'bg-warning-tint' : 'bg-danger-tint'}`}>
                {phase.kind === 'stopped' && phase.tone === 'info' ? <CreditCard size={34} color={C.warning} /> : <TriangleAlert size={34} color={C.danger} />}
              </View>
              <Display className="mt-5 text-center text-[24px]">{phase.kind === 'stopped' && phase.tone === 'info' ? 'Payment pending' : 'Payment unsuccessful'}</Display>
              <Txt className="mt-2 text-center leading-[21px] text-ink-soft">{phase.kind === 'stopped' ? phase.message : errorMessage(loadError)}</Txt>
              {o ? <Txt weight="semibold" className="mt-3">Amount: {formatINR(o.total)}</Txt> : null}
              <View className="mt-7 w-full gap-3">
                <Button title="Try again" size="lg" variant="accent" onPress={retry} />
                <Button title="Pay later from my orders" size="lg" variant="outline" onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: id! } })} />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
