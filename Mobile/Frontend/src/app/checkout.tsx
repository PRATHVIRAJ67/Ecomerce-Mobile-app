import type { CheckoutResult } from '@ecommerce/shared';
import { router } from 'expo-router';
import { ChevronRight, CreditCard, HandCoins, Lock, MapPin, Plus, ShoppingBag, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressLine } from '@/components/AddressForm';
import { DeliveryLocation, useDeliveryAddress } from '@/components/DeliveryLocation';
import { ProductImage } from '@/components/product/ProductImage';
import { RequireAuth } from '@/components/RequireAuth';
import { Badge, Button, Card, Display, EmptyState, ErrorState, Loading, Row, ScreenHeader, Txt } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatINR, plural } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { keys, useSettings } from '@/lib/queries';
import { queryClient } from '@/lib/queryClient';
import { C } from '@/lib/theme';

type Method = 'cod' | 'razorpay';
interface Problem {
  product_id: string;
  name: string;
  reason: 'unavailable' | 'out_of_stock' | 'insufficient_stock' | 'quantity_limit';
  available?: number;
}
const PROBLEM: Record<Problem['reason'], (p: Problem) => string> = {
  unavailable: () => 'is no longer available',
  out_of_stock: () => 'just went out of stock',
  insufficient_stock: (p) => `only has ${p.available} left`,
  quantity_limit: (p) => `is limited to ${p.available} per order`,
};

export default function CheckoutScreen() {
  return (
    <RequireAuth title="Checkout">
      <Checkout />
    </RequireAuth>
  );
}

function Checkout() {
  const insets = useSafeAreaInsets();
  const c = useCart();
  const { data: settings } = useSettings();
  const { address, addresses, loading: addrLoading } = useDeliveryAddress();
  const [chosen, setMethod] = useState<Method | null>(null);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const s = c.summary;

  // Payment availability mirrors the server rules; the server re-checks everything at checkout.
  const codAllowed = settings?.cod_enabled !== false && (!settings?.cod_max_order_value || (s?.total ?? 0) <= settings.cod_max_order_value);
  const onlineAllowed = Boolean(settings?.online_payments_available);

  const allowed = (m: Method | null) => (m === 'cod' ? codAllowed : m === 'razorpay' ? onlineAllowed : false);
  const method: Method | null = allowed(chosen) ? chosen : onlineAllowed ? 'razorpay' : codAllowed ? 'cod' : null;

  if (c.isLoading || addrLoading) return <Loading />;
  if (c.error && !s) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Checkout" />
        <ErrorState error={c.error} onRetry={() => void c.refetch()} />
      </View>
    );
  }
  if (!s || s.lines.length === 0) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Checkout" />
        <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Add something you love, then come back to check out." action={<Button title="Continue shopping" onPress={() => router.replace('/explore')} />} />
      </View>
    );
  }

  const blocked = s.has_unavailable_items || Boolean(settings?.maintenance_mode);

  const place = async () => {
    setFormError(null);
    if (!address) return setFormError('Add a delivery address to continue');
    if (!method) return setFormError('Choose a payment method');
    setPlacing(true);
    setProblems(null);
    try {
      const result = await api.post<CheckoutResult>('/me/checkout', { address_id: address.id, payment_method: method, notes: notes.trim() || null });
      // The server cleared the cart and reserved stock inside the checkout transaction.
      void queryClient.invalidateQueries({ queryKey: keys.cart });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
      void queryClient.invalidateQueries({ queryKey: keys.orders });
      queryClient.setQueryData(keys.order(result.order.id), result.order);
      haptic.success();
      if (result.order.payment_method === 'razorpay') router.replace({ pathname: '/payment/[id]', params: { id: result.order.id } });
      else router.replace({ pathname: '/order-confirmed/[id]', params: { id: result.order.id } });
    } catch (err) {
      haptic.error();
      if (err instanceof ApiError && err.code === 'cart_unavailable' && Array.isArray(err.details)) {
        setProblems(err.details as Problem[]);
        void c.refetch();
      } else setFormError(errorMessage(err));
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} className="bg-cream">
      <ScreenHeader title="Checkout" right={<Lock size={16} color={C.muted} />} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 130, gap: 16 }}>
        {/* Address */}
        <Section step={1} title="Delivery address">
          {address ? (
            <View>
              <View className="mb-1.5 flex-row gap-1.5">
                {address.label ? <Badge tone="forest">{address.label}</Badge> : null}
                {address.is_default ? <Badge>Default</Badge> : null}
              </View>
              <Txt weight="semibold">{address.full_name}</Txt>
              <Txt className="mt-0.5 text-[13.5px] leading-[19px] text-ink-soft">{addressLine(address)}</Txt>
              <Txt className="mt-0.5 text-[13.5px] text-ink-soft">Phone: {address.phone}</Txt>
              <View className="mt-3 flex-row items-center justify-between border-t border-line/70 pt-3">
                {addresses && addresses.length > 1 ? <DeliveryLocation /> : <View />}
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/addresses/form', params: { select: '1' } })} className="flex-row items-center gap-1" hitSlop={8}>
                  <Plus size={15} color={C.forest} />
                  <Txt weight="semibold" className="text-[13px] text-forest-700">
                    New address
                  </Txt>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/addresses/form', params: { select: '1' } })} className="flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-forest-300 p-4">
              <MapPin size={20} color={C.forest} />
              <Txt weight="semibold" className="flex-1 text-forest-700">
                Add a delivery address
              </Txt>
              <ChevronRight size={18} color={C.forest} />
            </Pressable>
          )}
        </Section>

        {/* Payment */}
        <Section step={2} title="Payment">
          <View className="gap-3" accessibilityRole="radiogroup">
            <PayOption icon={CreditCard} title="Pay online" text={onlineAllowed ? 'UPI, cards, netbanking & wallets — secured by Razorpay' : 'Online payment is not available right now'} selected={method === 'razorpay'} disabled={!onlineAllowed} onPress={() => setMethod('razorpay')} />
            <PayOption
              icon={HandCoins}
              title="Cash on Delivery"
              text={settings?.cod_enabled === false ? 'Not available right now' : !codAllowed ? `Available for orders up to ${formatINR(settings?.cod_max_order_value)}` : 'Pay in cash or UPI when it arrives'}
              selected={method === 'cod'}
              disabled={!codAllowed}
              onPress={() => setMethod('cod')}
            />
          </View>
          {!onlineAllowed && !codAllowed ? <Txt className="mt-3 text-[13px] text-danger">No payment method is available for this order right now. Please contact support.</Txt> : null}
          <Txt weight="medium" className="mb-1.5 mt-5 text-[13px] text-ink-soft">
            Delivery instructions <Txt className="text-[13px] text-muted">(optional)</Txt>
          </Txt>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
            multiline
            placeholder="E.g. call before arriving"
            placeholderTextColor={C.muted}
            accessibilityLabel="Delivery instructions"
            className="min-h-[80px] rounded-2xl border border-line bg-white p-4 font-sans text-[15px] text-ink"
            style={{ textAlignVertical: 'top' }}
          />
        </Section>

        {/* Summary */}
        <Card>
          <Txt className="mb-3 font-display text-[20px] text-ink">Your order</Txt>
          {s.lines.map((l) => (
            <View key={l.product_id} className="mb-3 flex-row items-center gap-3">
              <View>
                <ProductImage uri={l.product.images[0]?.url} seed={l.product.category_slug ?? l.product.slug} hints={[l.product.category_name, l.product.name]} style={{ width: 52, height: 52, borderRadius: 14 }} />
                <View className="absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full bg-forest-700">
                  <Txt weight="bold" className="text-[10px] text-cream">
                    {l.quantity}
                  </Txt>
                </View>
              </View>
              <View className="flex-1">
                <Txt weight="medium" className="text-[14px]" numberOfLines={1}>
                  {l.product.name}
                </Txt>
                {!l.available ? (
                  <Txt weight="semibold" className="text-[12px] text-danger">
                    Unavailable
                  </Txt>
                ) : (
                  <Txt className="text-[12px] text-muted">{l.product.unit}</Txt>
                )}
              </View>
              <Txt weight="semibold" className="text-[14px]">
                {formatINR(l.line_total)}
              </Txt>
            </View>
          ))}
          <View className="my-2 h-px bg-line" />
          <Row label={`Subtotal (${plural(s.item_count, 'item')})`} value={formatINR(s.subtotal)} />
          <Row label="Delivery" value={s.shipping_fee ? formatINR(s.shipping_fee) : <Txt weight="semibold" className="text-success">Free</Txt>} />
          <View className="my-2 h-px bg-line" />
          <Row label="Total" value={formatINR(s.total)} strong />
        </Card>

        {problems || s.has_unavailable_items ? (
          <View accessibilityRole="alert" className="rounded-2xl border border-warning/30 bg-warning-tint p-4">
            <View className="flex-row items-center gap-2">
              <TriangleAlert size={16} color={C.warning} />
              <Txt weight="semibold" className="text-warning">
                Some items need your attention
              </Txt>
            </View>
            {(problems ?? []).map((p) => (
              <Txt key={p.product_id} className="mt-1 text-[13px] text-ink-soft">
                • {p.name} {PROBLEM[p.reason](p)}
              </Txt>
            ))}
            <Button title="Review cart" variant="outline" size="sm" className="mt-3 self-start" onPress={() => router.navigate('/cart')} />
          </View>
        ) : null}
        {formError ? (
          <View accessibilityRole="alert" className="rounded-2xl bg-danger-tint px-4 py-3">
            <Txt className="text-danger">{formError}</Txt>
          </View>
        ) : null}
        <Txt className="text-center text-[12px] leading-[17px] text-muted">By placing this order you agree to our terms and return policy. Final prices and stock are confirmed by our server.</Txt>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          title={settings?.maintenance_mode ? 'Checkout paused for maintenance' : method === 'razorpay' ? `Pay ${formatINR(s.total)}` : `Place order · ${formatINR(s.total)}`}
          size="lg"
          variant="accent"
          loading={placing}
          disabled={blocked || !address || !method}
          onPress={() => void place()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-forest-700">
          <Txt weight="bold" className="text-[12px] text-cream">
            {step}
          </Txt>
        </View>
        <Display className="text-[20px]">{title}</Display>
      </View>
      {children}
    </Card>
  );
}

function PayOption({ icon: Icon, title, text, selected, disabled, onPress }: { icon: LucideIcon; title: string; text: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      className={`flex-row items-center gap-3.5 rounded-2xl border-2 p-4 ${selected ? 'border-forest-700 bg-forest-50' : 'border-line bg-white'} ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-white">
        <Icon size={20} color={C.forest} />
      </View>
      <View className="flex-1">
        <Txt weight="semibold" className="text-[15px]">
          {title}
        </Txt>
        <Txt className="text-[12.5px] leading-[17px] text-muted">{text}</Txt>
      </View>
      <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-forest-700' : 'border-line'}`}>{selected ? <View className="h-2.5 w-2.5 rounded-full bg-forest-700" /> : null}</View>
    </Pressable>
  );
}
