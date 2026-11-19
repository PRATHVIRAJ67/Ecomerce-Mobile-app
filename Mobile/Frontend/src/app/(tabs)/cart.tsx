import type { CartLine } from '@ecommerce/shared';
import { router } from 'expo-router';
import { ArrowRight, Lock, ShoppingBag, Trash2, TriangleAlert, Truck } from 'lucide-react-native';
import { memo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '@/components/layout/TabBar';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductRail } from '@/components/product/ProductRail';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button, Card, Display, EmptyState, ErrorState, Eyebrow, Row, Skeleton, Txt } from '@/components/ui';
import { AView } from '@/components/ui/animated';
import { useAuth } from '@/hooks/useAuth';
import { cart, useCart, useCartPending } from '@/hooks/useCart';
import { formatINR, plural } from '@/lib/format';
import { useHome, useSettings } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const { isSignedIn } = useAuth();
  const { data: settings } = useSettings();
  const c = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const s = c.summary;

  const header = (
    <View style={{ paddingTop: insets.top + 12 }} className="px-5 pb-4">
      <Eyebrow>Your bag</Eyebrow>
      <View className="mt-1 flex-row items-end justify-between">
        <Display className="text-[34px] leading-[40px]">Cart</Display>
        {s && s.lines.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void cart.clear()} hitSlop={8}>
            <Txt weight="medium" className="text-[13px] text-muted">
              Clear all
            </Txt>
          </Pressable>
        ) : null}
      </View>
      {s && s.item_count > 0 ? <Txt className="mt-1 text-muted">{plural(s.item_count, 'item')}</Txt> : null}
    </View>
  );

  if (c.isLoading && !s) {
    return (
      <View className="flex-1 bg-cream">
        {header}
        <View className="gap-3 px-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 120, borderRadius: 24 }} />
          ))}
        </View>
      </View>
    );
  }
  if (c.error && !s) {
    return (
      <View className="flex-1 bg-cream">
        {header}
        <ErrorState error={c.error} onRetry={() => void c.refetch()} title="We couldn't load your cart" />
      </View>
    );
  }
  if (!s || s.lines.length === 0) {
    return (
      <FlatList
        className="flex-1 bg-cream"
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {header}
            <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Spices, pickles, handloom — the good stuff from home is a few taps away." action={<Button title="Start shopping" onPress={() => router.push('/explore')} />} />
            <EmptySuggestions />
          </>
        }
        contentContainerStyle={{ paddingBottom: bottom + 8 }}
      />
    );
  }

  const threshold = settings?.free_shipping_threshold ?? 0;
  const toFree = threshold > 0 ? Math.max(0, threshold - s.subtotal) : 0;
  const progress = threshold > 0 ? Math.min(1, s.subtotal / threshold) : 1;
  const blocked = s.has_unavailable_items || s.subtotal <= 0 || Boolean(settings?.maintenance_mode);

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={s.lines}
        keyExtractor={(l) => l.product_id}
        renderItem={({ item }) => <CartRow line={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <>
            {header}
            {threshold > 0 ? (
              <View className="mx-5 mb-4 rounded-2xl bg-forest-50 p-4" accessible accessibilityLabel={toFree > 0 ? `Add ${formatINR(toFree)} more for free delivery` : 'Free delivery unlocked'}>
                <View className="flex-row items-center gap-2">
                  <Truck size={16} color={C.forest} />
                  <Txt weight="medium" className="flex-1 text-[13px] text-forest-800">
                    {toFree > 0 ? `Add ${formatINR(toFree)} more for free delivery` : 'You’ve unlocked free delivery'}
                  </Txt>
                </View>
                <View className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-forest-200">
                  <View className="h-full rounded-full bg-forest-700" style={{ width: `${progress * 100}%` }} />
                </View>
              </View>
            ) : null}
            {s.has_unavailable_items ? (
              <View accessibilityRole="alert" className="mx-5 mb-4 flex-row gap-3 rounded-2xl border border-warning/30 bg-warning-tint p-4">
                <TriangleAlert size={18} color={C.warning} />
                <Txt className="flex-1 text-[13px] leading-[18px] text-ink">Some items are out of stock or above the available quantity. Remove or adjust them to check out.</Txt>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <Card className="mx-5 mt-5">
            <Txt className="mb-2 font-display text-[20px] text-ink">Order summary</Txt>
            <Row label="Subtotal" value={formatINR(s.subtotal)} />
            <Row label="Delivery" value={s.shipping_fee ? formatINR(s.shipping_fee) : <Txt weight="semibold" className="text-success">Free</Txt>} />
            <View className="my-2 h-px bg-line" />
            <Row label="Total" value={formatINR(s.total)} strong />
            <View className="mt-3 flex-row items-center justify-center gap-1.5">
              <Lock size={12} color={C.muted} />
              <Txt className="text-[11.5px] text-muted">Prices and stock are re-checked when you place the order</Txt>
            </View>
          </Card>
        }
        contentContainerStyle={{ paddingBottom: bottom + 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.forest}
            onRefresh={async () => {
              setRefreshing(true);
              await c.refetch();
              setRefreshing(false);
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky checkout bar above the tab bar */}
      <View className="absolute inset-x-0 px-4" style={{ bottom: bottom - 4 }}>
        <View className="flex-row items-center gap-3 rounded-3xl border border-line bg-white p-3 pl-5" style={{ shadowColor: '#0F3526', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
          <View className="flex-1">
            <Txt className="text-[11.5px] text-muted">Total</Txt>
            <Txt weight="bold" className="text-[19px]">
              {formatINR(s.total)}
            </Txt>
          </View>
          <Button
            title={settings?.maintenance_mode ? 'Checkout paused' : isSignedIn ? 'Checkout' : 'Sign in to checkout'}
            iconRight={ArrowRight}
            variant="accent"
            disabled={blocked}
            onPress={() => router.push(isSignedIn ? '/checkout' : { pathname: '/login', params: { next: '/checkout' } })}
          />
        </View>
      </View>
    </View>
  );
}

const CartRow = memo(function CartRow({ line }: { line: CartLine }) {
  const p = line.product;
  const busy = useCartPending(p.id);
  const over = p.in_stock && line.quantity > p.max_order_quantity;
  return (
    <AView exiting={FadeOut.duration(160)} layout={LinearTransition.springify().damping(18)} className="mx-5 flex-row gap-3.5 rounded-3xl border border-line/70 bg-white p-3">
      <Pressable accessibilityRole="link" accessibilityLabel={`Open ${p.name}`} onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: p.slug } })}>
        <ProductImage uri={p.images[0]?.url} seed={p.category_slug ?? p.slug} hints={[p.category_name, p.name]} style={{ width: 92, height: 108, borderRadius: 18, opacity: line.available ? 1 : 0.55 }} />
      </Pressable>
      <View className="flex-1">
        <View className="flex-row items-start gap-2">
          <Txt weight="semibold" className="flex-1 text-[14.5px] leading-[19px]" numberOfLines={2}>
            {p.name}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.name}`} hitSlop={10} onPress={() => void cart.remove(p.id)} disabled={busy}>
            <Trash2 size={17} color={C.muted} />
          </Pressable>
        </View>
        <Txt className="mt-0.5 text-[12px] text-muted" numberOfLines={1}>
          {[p.unit, p.origin].filter(Boolean).join(' · ')}
        </Txt>
        {!p.in_stock ? (
          <Txt weight="semibold" className="mt-1 text-[12.5px] text-danger">
            Out of stock — please remove
          </Txt>
        ) : over ? (
          <Txt weight="semibold" className="mt-1 text-[12.5px] text-warning">
            Only {p.max_order_quantity} available — reduce quantity
          </Txt>
        ) : null}
        <View className="mt-auto flex-row items-end justify-between pt-2">
          {p.in_stock ? (
            <QuantityStepper
              size="sm"
              value={line.quantity}
              max={Math.max(1, p.max_order_quantity)}
              removable
              busy={busy}
              label={`Quantity of ${p.name}`}
              onChange={(n) => void (n <= 0 ? cart.remove(p.id) : cart.setQuantity(p, Math.min(n, p.max_order_quantity)))}
            />
          ) : (
            <View />
          )}
          <Txt weight="bold" className="text-[15.5px]">
            {formatINR(line.line_total)}
          </Txt>
        </View>
      </View>
    </AView>
  );
});

function EmptySuggestions() {
  const { data, isPending } = useHome();
  return (
    <View className="mt-2">
      <ProductRail eyebrow="Popular picks" title="Customers love these" products={data?.best_sellers} loading={isPending} />
    </View>
  );
}
