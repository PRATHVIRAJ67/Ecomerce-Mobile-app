import { router } from 'expo-router';
import { Bell, CircleCheck, CircleX, Clock, Package, Truck, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, Display, EmptyState, ErrorState, PressableScale, ScreenHeader, Skeleton, Txt } from '@/components/ui';
import { useOrderUpdates } from '@/hooks/useNotifications';
import { timeAgo } from '@/lib/format';
import { C } from '@/lib/theme';
import { usePrefs } from '@/store';
import type { OrderStatus } from '@ecommerce/shared';

const ICON: Record<OrderStatus, { icon: LucideIcon; color: string; bg: string }> = {
  pending_payment: { icon: Clock, color: C.warning, bg: 'bg-warning-tint' },
  confirmed: { icon: Package, color: C.forest, bg: 'bg-forest-100' },
  packed: { icon: Package, color: C.forest, bg: 'bg-forest-100' },
  shipped: { icon: Truck, color: C.forest, bg: 'bg-forest-100' },
  out_for_delivery: { icon: Truck, color: C.terracotta600, bg: 'bg-terracotta-100' },
  delivered: { icon: CircleCheck, color: C.success, bg: 'bg-success-tint' },
  cancelled: { icon: CircleX, color: C.danger, bg: 'bg-danger-tint' },
};

export default function NotificationsScreen() {
  return (
    <RequireAuth title="Notifications">
      <Notifications />
    </RequireAuth>
  );
}

function Notifications() {
  const insets = useSafeAreaInsets();
  const { updates, query } = useOrderUpdates();
  const markSeen = usePrefs((s) => s.markNotificationsSeen);

  // Mark as read when leaving, so unread items stay highlighted while the screen is open.
  useEffect(() => () => markSeen(), [markSeen]);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Notifications" />
      {query.error && !query.data ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={updates}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={C.forest} />}
          ListHeaderComponent={
            <View className="mb-2">
              <Display className="text-[28px]">Order updates</Display>
              <Txt className="mt-1 text-[13px] text-muted">The latest status of each of your orders.</Txt>
            </View>
          }
          ListEmptyComponent={
            query.isPending ? (
              <View className="gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} style={{ height: 84, borderRadius: 22 }} />
                ))}
              </View>
            ) : (
              <EmptyState icon={Bell} title="You're all caught up" message="Updates about your orders will appear here." action={<Button title="Start shopping" onPress={() => router.navigate('/explore')} />} />
            )
          }
          renderItem={({ item }) => {
            const meta = ICON[item.status];
            const Icon = meta.icon;
            return (
              <PressableScale onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.orderId } })} scaleTo={0.985} accessibilityLabel={`${item.unread ? 'New. ' : ''}${item.title}. ${item.body}`} className={`flex-row gap-3.5 rounded-3xl border p-4 ${item.unread ? 'border-terracotta-200 bg-white' : 'border-line/70 bg-white/70'}`}>
                <View className={`h-11 w-11 items-center justify-center rounded-2xl ${meta.bg}`}>
                  <Icon size={20} color={meta.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Txt weight="semibold" className="flex-1 text-[14.5px]" numberOfLines={1}>
                      {item.title}
                    </Txt>
                    {item.unread ? <View className="h-2 w-2 rounded-full bg-terracotta-500" /> : null}
                  </View>
                  <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-soft">{item.body}</Txt>
                  <Txt className="mt-1 text-[11.5px] text-muted">{timeAgo(item.at)}</Txt>
                </View>
              </PressableScale>
            );
          }}
        />
      )}
    </View>
  );
}
