import { router } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderStatusBadge } from '@/components/OrderTimeline';
import { ProductImage } from '@/components/product/ProductImage';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Display, EmptyState, ErrorState, PressableScale, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { formatDate, formatINR, plural } from '@/lib/format';
import { useOrderList } from '@/lib/queries';
import { C } from '@/lib/theme';

export default function OrdersScreen() {
  return (
    <RequireAuth title="Your orders">
      <Orders />
    </RequireAuth>
  );
}

function Orders() {
  const insets = useSafeAreaInsets();
  const q = useOrderList();
  const orders = useMemo(() => q.data?.pages.flatMap((p) => p.items), [q.data]);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Your orders" />
      {q.error && !orders ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => void q.refetch()} tintColor={C.forest} />}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<Display className="mb-2 text-[28px]">Order history</Display>}
          ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={C.forest} /> : undefined}
          ListEmptyComponent={
            q.isPending ? (
              <View className="gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} style={{ height: 128, borderRadius: 24 }} />
                ))}
              </View>
            ) : (
              <EmptyState icon={Package} title="No orders yet" message="When you place an order, you can track it here." action={<Button title="Start shopping" onPress={() => router.navigate('/explore')} />} />
            )
          }
          renderItem={({ item: o }) => (
            <PressableScale onPress={() => router.push({ pathname: '/orders/[id]', params: { id: o.id } })} scaleTo={0.985} accessibilityLabel={`Order ${o.order_number}, ${formatINR(o.total)}, placed ${formatDate(o.placed_at)}`} className="rounded-3xl border border-line/70 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Txt weight="bold" className="text-[15px]">
                  {o.order_number}
                </Txt>
                <OrderStatusBadge status={o.status} />
              </View>
              <View className="mt-3 flex-row items-center gap-3">
                <View className="flex-row">
                  {(o.items ?? []).slice(0, 3).map((it, i) => (
                    <View key={i} style={{ marginLeft: i ? -14 : 0, borderWidth: 2, borderColor: C.white, borderRadius: 14 }}>
                      <ProductImage uri={it.image_url} seed={it.product_name} hints={[it.product_name]} style={{ width: 48, height: 48, borderRadius: 12 }} />
                    </View>
                  ))}
                </View>
                <View className="flex-1">
                  <Txt className="text-[13px] text-ink-soft" numberOfLines={1}>
                    {(o.items ?? []).map((i) => i.product_name).join(', ')}
                  </Txt>
                  <Txt className="mt-0.5 text-[12px] text-muted">
                    {formatDate(o.placed_at)} · {plural(o.item_count, 'item')}
                  </Txt>
                </View>
              </View>
              <View className="mt-3 flex-row items-center justify-between border-t border-line/70 pt-3">
                <Txt weight="bold">{formatINR(o.total)}</Txt>
                <View className="flex-row items-center gap-1">
                  <Txt weight="semibold" className="text-[13px] text-forest-700">
                    {o.status === 'pending_payment' ? 'Pay now' : 'Track order'}
                  </Txt>
                  <ChevronRight size={16} color={C.forest} />
                </View>
              </View>
            </PressableScale>
          )}
        />
      )}
    </View>
  );
}
